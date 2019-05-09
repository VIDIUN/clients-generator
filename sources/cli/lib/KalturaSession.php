<?php
// ===================================================================================================
//                           _  __     _ _
//                          | |/ /__ _| | |_ _  _ _ _ __ _
//                          | ' </ _` | |  _| || | '_/ _` |
//                          |_|\_\__,_|_|\__|\_,_|_| \__,_|
//
// This file is part of the Vidiun Collaborative Media Suite which allows users
// to do with audio, video, and animation what Wiki platfroms allow them to do with
// text.
//
// Copyright (C) 2006-2011  Vidiun Inc.
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU Affero General Public License as
// published by the Free Software Foundation, either version 3 of the
// License, or (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU Affero General Public License for more details.
//
// You should have received a copy of the GNU Affero General Public License
// along with this program.  If not, see <http://www.gnu.org/licenses/>.
//
// @ignore
// ===================================================================================================

require_once(dirname(__file__) . '/VidiunSecretRepository.php');

class VidiunSession
{
	// VS V1 constants
	const SEPARATOR = ";";
	
	// VS V2 constants
	const SHA1_SIZE = 20;
	const RANDOM_SIZE = 16;
	const AES_IV = "\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0";	// no need for an IV since we add a random string to the message anyway
	
	const FIELD_EXPIRY =              '_e';
	const FIELD_TYPE =                '_t';
	const FIELD_USER =                '_u';
	const FIELD_MASTER_PARTNER_ID =   '_m';
	const FIELD_ADDITIONAL_DATA =     '_d';

	protected static $fieldMapping = array(
		self::FIELD_EXPIRY => 'valid_until',
		self::FIELD_TYPE => 'type',
		self::FIELD_USER => 'user',
		self::FIELD_MASTER_PARTNER_ID => 'master_partner_id',
		self::FIELD_ADDITIONAL_DATA => 'additional_data',
	);
	
	static protected $secretRepositories = array();
	
	// Members
	public $version = null;
	public $hash = null;
	public $real_str = null;
	public $original_str = "";

	public $partner_id = null;
	public $partner_pattern = null;
	public $valid_until = null;
	public $type = null;
	public $rand = null;
	public $user = null;
	public $privileges = null;
	public $master_partner_id = null;
	public $additional_data = null;
	
	/**
	 * @param string $encoded_str
	 * @return VidiunSession
	 */
	public static function getVSObject($encoded_str)
	{
		if (empty($encoded_str))
			return null;

		$vs = new VidiunSession();		
		if (!$vs->parseVS($encoded_str))
			return null;

		return $vs;
	}
	
	/**
	 * @param string $encoded_str
	 * @return boolean
	 */
	public function parseVS($encoded_str)
	{
		// try V2
		if ($this->parseVsV2($encoded_str))
			return true;
	
		// try V1
		if ($this->parseVsV1($encoded_str))
			return true;
			
		return false;
	}
	
	public function generateVs()
	{
		$adminSecret = VidiunSecretRepository::getAdminSecret($this->partner_id);
		if (!$adminSecret)
			return null;
			
		if ($this->version == 2)
			return self::generateVsV2(
				$adminSecret, 
				$this->user, 
				$this->type, 
				$this->partner_id, 
				$this->valid_until - time(), 
				$this->privileges, 
				$this->master_partner_id, 
				$this->additional_data);

		return self::generateVsV1(
			$adminSecret, 
			$this->user, 
			$this->type, 
			$this->partner_id, 
			$this->valid_until - time(), 
			$this->privileges, 
			$this->master_partner_id, 
			$this->additional_data);
	}
	
    static function extendVs($vs, $expiry = 86400)
	{
        $vsObj = VidiunSession::getVsObject($vs);
        if (!$vsObj)
            return null;
        $vsObj->valid_until = time() + $expiry;
        return $vsObj->generateVs();
	}

	// overridable
	protected function logError($msg)
	{
	}

	static public function registerSecretRepository($repo)
	{
		VidiunSession::$secretRepositories[] = $repo;
	}
			
	// VS V1 functions
	public static function generateVsV1($adminSecret, $userId, $type, $partnerId, $expiry, $privileges, $masterPartnerId, $additionalData)
	{
		$rand = microtime(true);
		$expiry = time() + $expiry;
		$fields = array(
			$partnerId,
			$partnerId,
			$expiry,
			$type,
			$rand,
			$userId,
			$privileges,
			$masterPartnerId,
			$additionalData,
		);
		$info = implode ( ";" , $fields );

		$signature = sha1( $adminSecret . $info );
		$strToHash =  $signature . "|" . $info ;
		$encoded_str = base64_encode( $strToHash );

		return $encoded_str;
	}

	public function parseVsV1($encoded_str)
	{
		$str = base64_decode($encoded_str, true);
		if (strpos($str, "|") === false)
		{
			$this->logError("Couldn't find | seperator in the VS");
			return false;
		}
			
		list($hash , $real_str) = explode( "|" , $str , 2 );

		$parts = explode(self::SEPARATOR, $real_str);
		if (count($parts) < 3)
		{
			$this->logError("Couldn't find 3 seperated parts in the VS");
			return false;
		}
		
		$partnerId = reset($parts);
		$salt = VidiunSecretRepository::getAdminSecret($partnerId);
		if (!$salt)
		{
			$this->logError("Couldn't get admin secret for partner [$partnerId]");
			return false;
		}

		if (sha1($salt . $real_str) != $hash)
		{
			$this->logError("Hash [$hash] doesn't match the sha1 on the salt on partner [$partnerId].");
			return false;
		}
		
		list(
			$this->partner_id,
			$this->partner_pattern,
			$this->valid_until,
		) = $parts;

		if(isset($parts[3]))
			$this->type = $parts[3];

		if(isset($parts[4]))
			$this->rand = $parts[4];
		
		if(isset($parts[5]))
			$this->user = $parts[5];
			
		if(isset($parts[6]))
			$this->privileges = $parts[6];
			
		if(isset($parts[7]))
			$this->master_partner_id = $parts[7];
		
		if(isset($parts[8]))
			$this->additional_data = $parts[8];

		$this->hash = $hash;
		$this->real_str = $real_str;
		$this->original_str = $encoded_str;
		$this->version = 1;
		return true;
	}

	// VS V2 functions
	protected static function aesEncrypt($key, $message)
	{
		
		$key = substr(sha1($key, true), 0, 16);
		if (function_exists('mcrypt_encrypt')) {
			return mcrypt_encrypt(
				MCRYPT_RIJNDAEL_128,
				$key,
				$message,
				MCRYPT_MODE_CBC,
				self::AES_IV // no need for a real IV since we add a random string to the message anyway
			);
		}else {
			// Pad with null byte to be compatible with mcrypt PKCS#5 padding
		        // See http://thefsb.tumblr.com/post/110749271235/using-opensslendecrypt-in-php-instead-of as reference
			$blockSize = 16;
			if (strlen($message) % $blockSize) {
			    $padLength = $blockSize - strlen($message) % $blockSize;
			    $message .= str_repeat("\0", $padLength);
			}
			return openssl_encrypt(
				$message,
				'AES-128-CBC',
				$key,
				OPENSSL_RAW_DATA | OPENSSL_ZERO_PADDING,
				self::AES_IV
			);
		}
	}

	protected static function aesDecrypt($key, $message)
	{
		if (function_exists('mcrypt_decrypt')) {
		    return mcrypt_decrypt(
			MCRYPT_RIJNDAEL_128,
			substr(sha1($key, true), 0, 16),
			$message,
			MCRYPT_MODE_CBC, 
			self::AES_IV
		    );
		}else{
		    return openssl_decrypt(
				$message,
				'AES-128-CBC',
				substr(sha1($key, true), 0, 16),
				OPENSSL_RAW_DATA | OPENSSL_ZERO_PADDING,
				self::AES_IV
			);

		}
	}

	public static function generateVsV2($adminSecret, $userId, $type, $partnerId, $expiry, $privileges, $masterPartnerId, $additionalData)
	{
		// build fields array
		$fields = array();
		foreach (explode(',', $privileges) as $privilege)
		{
			$privilege = trim($privilege);
			if (!$privilege)
				continue;
			if ($privilege == '*')
				$privilege = 'all:*';
			$splittedPrivilege = explode(':', $privilege, 2);
			if (count($splittedPrivilege) > 1)
				$fields[$splittedPrivilege[0]] = $splittedPrivilege[1];
			else
				$fields[$splittedPrivilege[0]] = '';
		}
		$fields[self::FIELD_EXPIRY] = time() + $expiry;
		$fields[self::FIELD_TYPE] = $type;
		$fields[self::FIELD_USER] = $userId;
		$fields[self::FIELD_MASTER_PARTNER_ID] = $masterPartnerId;
		$fields[self::FIELD_ADDITIONAL_DATA] = $additionalData;

		// build fields string
		$fieldsStr = http_build_query($fields, '', '&');
		$rand = '';
		for ($i = 0; $i < self::RANDOM_SIZE; $i++)
			$rand .= chr(rand(0, 0xff));
		$fieldsStr = $rand . $fieldsStr;
		$fieldsStr = sha1($fieldsStr, true) . $fieldsStr;
		
		// encrypt and encode
		$encryptedFields = self::aesEncrypt($adminSecret, $fieldsStr);
		$decodedVs = "v2|{$partnerId}|" . $encryptedFields;
		return str_replace(array('+', '/'), array('-', '_'), base64_encode($decodedVs));
	}
	
	public function parseVsV2($vs)
	{
		$decodedVs = base64_decode(str_replace(array('-', '_'), array('+', '/'), $vs), true);
		if (!$decodedVs)
		{
			$this->logError("Couldn't base 64 decode the VS.");
			return false;
		}
		
		$explodedVs = explode('|', $decodedVs , 3);
		if (count($explodedVs) != 3)
			return false;						// not VS V2
		
		list($version, $partnerId, $encVs) = $explodedVs;
		if ($version != 'v2')
		{
			$this->logError("VS version [$version] is not [v2].");
			return false;						// not VS V2
		}
		
		$adminSecret = VidiunSecretRepository::getAdminSecret($partnerId);
		if (!$adminSecret)
		{
			$this->logError("Couldn't get secret for partner [$partnerId].");
			return false;						// admin secret not found, can't decrypt the VS
		}
				
		$decVs = self::aesDecrypt($adminSecret, $encVs);
		$decVs = rtrim($decVs, "\0");
		
		$hash = substr($decVs, 0, self::SHA1_SIZE);
		$fields = substr($decVs, self::SHA1_SIZE);
		if ($hash != sha1($fields, true))
		{
			$this->logError("Hash [$hash] doesn't match sha1 on partner [$partnerId].");
			return false;						// invalid signature
		}
		
		$rand = substr($fields, 0, self::RANDOM_SIZE);
		$fields = substr($fields, self::RANDOM_SIZE);
		
		$fieldsArr = null;
		parse_str($fields, $fieldsArr);
		
		// TODO: the following code translates a VS v2 into members that are more suitable for V1
		//	in the future it makes sense to change the structure of the vs class
		$privileges = array();
		foreach ($fieldsArr as $fieldName => $fieldValue)
		{
			if (isset(self::$fieldMapping[$fieldName]))
			{
				$fieldMember = self::$fieldMapping[$fieldName];
				$this->$fieldMember = $fieldValue;
				continue;
			}
			if ($fieldValue)
				$privileges[] = "{$fieldName}:{$fieldValue}";
			else 
				$privileges[] = "{$fieldName}";
		}
		
		$this->hash = bin2hex($hash);
		$this->real_str = $fields;
		$this->original_str = $vs;
		$this->partner_id = $partnerId;
		$this->rand = bin2hex($rand);
		$this->privileges = implode(',', $privileges);
		if ($this->privileges == 'all:*')
			$this->privileges = '*';
		$this->version = 2;

		return true;
	}
}

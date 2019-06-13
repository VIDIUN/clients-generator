<?php
// ===================================================================================================
//						   _  __	 _ _
//						  | |/ /__ _| | |_ _  _ _ _ __ _
//						  | ' </ _` | |  _| || | '_/ _` |
//						  |_|\_\__,_|_|\__|\_,_|_| \__,_|
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

/**
 * Private class for null value
 */
class VidiunNull
{
	private static $instance;

	private function __construct()
	{

	}

	public static function getInstance()
	{
		if (!isset(self::$instance)) {
			$c = __CLASS__;
			self::$instance = new $c();
		}
		return self::$instance;
	}

	function __toString()
	{
		return '';
	}


}

/**
 * @package Vidiun
 * @subpackage Client
 */
class Vidiun_Client_ClientBase
{
	const VIDIUN_SERVICE_FORMAT_JSON = 1;
	const VIDIUN_SERVICE_FORMAT_XML  = 2;
	const VIDIUN_SERVICE_FORMAT_PHP  = 3;

	// VS V2 constants
	const RANDOM_SIZE = 16;

	const FIELD_EXPIRY =			  '_e';
	const FIELD_TYPE =				'_t';
	const FIELD_USER =				'_u';

	/**
	 * @var Vidiun_Client_Configuration
	 */
	protected $config;

	/**
	 * @var array
	 */
	protected $clientConfiguration = array();

	/**
	 * @var array
	 */
	protected $requestConfiguration = array();

	/**
	 * @var boolean
	 */
	private $shouldLog = false;

	/**
	 * @var Array of classes
	 */
	private $multiRequestReturnType = null;

	/**
	 * @var array<Vidiun_Client_ServiceActionCall>
	 */
	private $callsQueue = array();

	/**
	 * @var array<string>
	 */
	private $responseHeaders = array();

	/**
	 * Vidiun client constructor
	 *
	 * @param Vidiun_Client_Configuration $config
	 */
	public function __construct(Vidiun_Client_Configuration $config)
	{
		$this->config = $config;

		$logger = $this->config->getLogger();
		if ($logger)
			$this->shouldLog = true;
	}

	/* Store response headers into array */
	public function readHeader($ch, $string)
	{
		array_push($this->responseHeaders, $string);
		return strlen($string);
	}

	/* Retrive response headers */
	public function getResponseHeaders()
	{
		return $this->responseHeaders;
	}

	public function getServeUrl()
	{
		if (count($this->callsQueue) != 1)
			return null;

		$params = array();
		$files = array();
		$this->log("service url: [" . $this->config->serviceUrl . "]");

		// append the basic params
		$this->addParam($params, "format", $this->config->format);

		foreach($this->clientConfiguration as $param => $value)
		{
			$this->addParam($params, $param, $value);
		}

		$call = $this->callsQueue[0];
		$this->callsQueue = array();

		$params = array_merge($params, $call->params);
		$signature = $this->signature($params);
		$this->addParam($params, "vidsig", $signature);

		$url = $this->config->serviceUrl . "/api_v3/service/{$call->service}/action/{$call->action}";
		$url .= '?' . http_build_query($params);
		$this->log("Returned url [$url]");
		return $url;
	}

	public function queueServiceActionCall($service, $action, $returnType, $params = array(), $files = array())
	{
		foreach($this->requestConfiguration as $param => $value)
		{
			$this->addParam($params, $param, $value);
		}

		$call = new Vidiun_Client_ServiceActionCall($service, $action, $params, $files);
		if(!is_null($this->multiRequestReturnType))
			$this->multiRequestReturnType[] = $returnType;
		$this->callsQueue[] = $call;
	}

	protected function resetRequest()
	{
		$this->multiRequestReturnType = null;
		$this->callsQueue = array();
	}

	/**
	 * Call all API service that are in queue
	 *
	 * @return unknown
	 */
	public function doQueue()
	{
		if (count($this->callsQueue) == 0)
		{
			$this->resetRequest();
			return null;
		}

		$startTime = microtime(true);

		$params = array();
		$files = array();
		$this->log("service url: [" . $this->config->serviceUrl . "]");

		// append the basic params
		$this->addParam($params, "format", $this->config->format);
		$this->addParam($params, "ignoreNull", true);

		foreach($this->clientConfiguration as $param => $value)
		{
			$this->addParam($params, $param, $value);
		}

		$url = trim($this->config->serviceUrl, '/') . "/api_v3/service";
		if (!is_null($this->multiRequestReturnType))
		{
			$url .= "/multirequest";
			$i = 0;
			foreach ($this->callsQueue as $call)
			{
				$callParams = $call->getParamsForMultiRequest($i);
				$callFiles = $call->getFilesForMultiRequest($i);
				$params = array_merge($params, $callParams);
				$files = array_merge($files, $callFiles);
				$i++;
			}
		}
		else
		{
			$call = $this->callsQueue[0];
			$url .= "/{$call->service}/action/{$call->action}";
			$params = array_merge($params, $call->params);
			$files = $call->files;
		}

		// reset
		$this->callsQueue = array();

		$signature = $this->signature($params);
		$this->addParam($params, "vidsig", $signature);

		list($postResult, $errorCode, $error) = $this->doHttpRequest($url, $params, $files);

		if ($error || ($errorCode != 200 ))
		{
			$error .= ". RC : $errorCode";
			$this->resetRequest();
			throw $this->getVidiunClientException($error, Vidiun_Client_ClientException::ERROR_GENERIC);
		}
		else
		{
			// print server debug info to log
			$serverName = null;
			$serverSession = null;
			foreach ($this->responseHeaders as $curHeader)
			{
				$splittedHeader = explode(':', $curHeader, 2);
				if ($splittedHeader[0] == 'X-Me')
					$serverName = trim($splittedHeader[1]);
				else if ($splittedHeader[0] == 'X-Vidiun-Session')
					$serverSession = trim($splittedHeader[1]);
			}
			if (!is_null($serverName) || !is_null($serverSession))
				$this->log("server: [{$serverName}], session: [{$serverSession}]");

			$this->log("result (serialized): " . $postResult);

			if ($this->config->format != self::VIDIUN_SERVICE_FORMAT_XML)
			{
				$this->resetRequest();
				throw $this->getVidiunClientException("unsupported format: $postResult", Vidiun_Client_ClientException::ERROR_FORMAT_NOT_SUPPORTED);
			}
		}

		$this->resetRequest();

		$endTime = microtime (true);

		$this->log("execution time for [".$url."]: [" . ($endTime - $startTime) . "]");

		return $postResult;
	}

	/**
	 * Sorts array recursively
	 *
	 * @param array $params
	 * @param int $flags
	 * @return boolean
	 */
	protected function vsortRecursive(&$array, $flags = null)
	{
		ksort($array, $flags);
		foreach($array as &$arr) {
			if(is_array($arr))
				$this->vsortRecursive($arr, $flags);
		}
		return true;
	}

	/**
	 * Sign array of parameters
	 *
	 * @param array $params
	 * @return string
	 */
	private function signature($params)
	{
		$this->vsortRecursive($params);
		return md5($this->jsonEncode($params));
	}

	/**
	 * Send http request by using curl (if available) or php stream_context
	 *
	 * @param string $url
	 * @param parameters $params
	 * @return array of result and error
	 */
	private function doHttpRequest($url, $params = array(), $files = array())
	{
		if (function_exists('curl_init'))
			return $this->doCurl($url, $params, $files);
		else
			return $this->doPostRequest($url, $params, $files);
	}

	/**
	 * Curl HTTP POST Request
	 *
	 * @param string $url
	 * @param array $params
	 * @return array of result and error
	 */
	private function doCurl($url, $params = array(), $files = array())
	{
		$this->responseHeaders = array();
		$requestHeaders = $this->config->requestHeaders;

		$params = $this->jsonEncode($params);
		$this->log("curl: $url");
		$this->log("post: $params");
		if($this->config->format == self::VIDIUN_SERVICE_FORMAT_JSON)
		{
			$requestHeaders[] = 'Accept: application/json';
		}
		else
		{
			$requestHeaders[] = 'Accept: text/xml';
		}

		$cookies = array();
		$ch = curl_init();
		curl_setopt($ch, CURLOPT_URL, $url);
		curl_setopt($ch, CURLOPT_POST, 1);
		if (count($files) > 0)
		{
			$params = array('json' => $params);
			foreach ($files as $key => $file) {
				// The usage of the @filename API for file uploading is
				// deprecated since PHP 5.5. CURLFile must be used instead.
				if (PHP_VERSION_ID >= 50500) {
					$params[$key] = new \CURLFile($file);
				} else {
					$params[$key] = "@" . $file; // let curl know its a file
				}
			}
			curl_setopt($ch, CURLOPT_POSTFIELDS, $params);
		}
		else
		{
			$requestHeaders[] = 'Content-Type: application/json';
			curl_setopt($ch, CURLOPT_POSTFIELDS, $params);
		}
		curl_setopt($ch, CURLOPT_ENCODING, 'gzip,deflate');
		curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
		curl_setopt($ch, CURLOPT_USERAGENT, $this->config->userAgent);
		if (count($files) > 0)
			curl_setopt($ch, CURLOPT_TIMEOUT, 0);
		else
			curl_setopt($ch, CURLOPT_TIMEOUT, $this->config->curlTimeout);

		if ($this->config->startZendDebuggerSession === true)
		{
			$zendDebuggerParams = $this->getZendDebuggerParams($url);
			$cookies = array_merge($cookies, $zendDebuggerParams);
		}

		if (count($cookies) > 0)
		{
			$cookiesStr = http_build_query($cookies, null, '; ');
			curl_setopt($ch, CURLOPT_COOKIE, $cookiesStr);
		}

		if (isset($this->config->proxyHost)) {
			curl_setopt($ch, CURLOPT_HTTPPROXYTUNNEL, $this->config->proxyTunnel);
			curl_setopt($ch, CURLOPT_PROXY, $this->config->proxyHost);
			if (isset($this->config->proxyPort)) {
				curl_setopt($ch, CURLOPT_PROXYPORT, $this->config->proxyPort);
			}
			if (isset($this->config->proxyUser)) {
				curl_setopt($ch, CURLOPT_PROXYUSERPWD, $this->config->proxyUser.':'.$this->config->proxyPassword);
			}
			if (isset($this->config->proxyType) && $this->config->proxyType === 'SOCKS5') {
				curl_setopt($ch, CURLOPT_PROXYTYPE, CURLPROXY_SOCKS5);
			}
		}

		if(!$this->config->verifySSL)
		{
			curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
			curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, 2);
		}
		elseif($this->config->sslCertificatePath)
		{
			curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true);
			curl_setopt($ch, CURLOPT_CAINFO, $this->config->sslCertificatePath);
		}

		// Set custom headers
		curl_setopt($ch, CURLOPT_HTTPHEADER, $requestHeaders);

		// Save response headers
		curl_setopt($ch, CURLOPT_HEADERFUNCTION, array($this, 'readHeader') );

		$result = curl_exec($ch);
		$curlError = curl_error($ch);
		$curlErrorCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
		curl_close($ch);
		return array($result, $curlErrorCode, $curlError);
	}

	/**
	 * HTTP stream context request
	 *
	 * @param string $url
	 * @param array $params
	 * @return array of result and error
	 */
	private function doPostRequest($url, $params = array(), $files = array())
	{
		if (count($files) > 0)
			throw $this->getVidiunClientException("Uploading files is not supported with stream context http request, please use curl", Vidiun_Client_ClientException::ERROR_UPLOAD_NOT_SUPPORTED);

		$formattedData = http_build_query($params , "", "&");
		$params = array('http' => array(
			"method" => "POST",
			"User-Agent: " . $this->config->userAgent . "\r\n".
			"Accept-language: en\r\n".
			"Content-type: application/x-www-form-urlencoded\r\n",
			"content" => $formattedData
		));

		if (isset($this->config->proxyType) && $this->config->proxyType === 'SOCKS5') {
			throw $this->getVidiunClientException("Cannot use SOCKS5 without curl installed.", Vidiun_Client_ClientException::ERROR_CONNECTION_FAILED);
		}
		if (isset($this->config->proxyHost)) {
			$proxyhost = 'tcp://' . $this->config->proxyHost;
			if (isset($this->config->proxyPort)) {
				$proxyhost = $proxyhost . ":" . $this->config->proxyPort;
			}
			$params['http']['proxy'] = $proxyhost;
			$params['http']['request_fulluri'] = true;
			if (isset($this->config->proxyUser)) {
				$auth = base64_encode($this->config->proxyUser.':'.$this->config->proxyPassword);
				$params['http']['header'] = 'Proxy-Authorization: Basic ' . $auth;
			}
		}

		$ctx = stream_context_create($params);
		$fp = @fopen($url, 'rb', false, $ctx);
		if (!$fp) {
			$phpErrorMsg = "";
			throw $this->getVidiunClientException("Problem with $url, $phpErrorMsg", Vidiun_Client_ClientException::ERROR_CONNECTION_FAILED);
		}
		$response = @stream_get_contents($fp);
		if ($response === false) {
			throw $this->getVidiunClientException("Problem reading data from $url, $phpErrorMsg", Vidiun_Client_ClientException::ERROR_READ_FAILED);
		}
		return array($response, 200, '');
	}

	/**
	 * @return Vidiun_Client_Configuration
	 */
	public function getConfig()
	{
		return $this->config;
	}

	/**
	 * @param Vidiun_Client_Configuration $config
	 */
	public function setConfig(Vidiun_Client_Configuration $config)
	{
		$this->config = $config;

		$logger = $this->config->getLogger();
		if ($logger instanceof Vidiun_Client_ILogger)
		{
			$this->shouldLog = true;
		}
	}

	public function setClientConfiguration(Vidiun_Client_Type_ClientConfiguration $configuration)
	{
		$params = get_class_vars('Vidiun_Client_Type_ClientConfiguration');
		foreach($params as $param)
		{
			if(is_null($configuration->$param))
			{
				if(isset($this->clientConfiguration[$param]))
				{
					unset($this->clientConfiguration[$param]);
				}
			}
			else
			{
				$this->clientConfiguration[$param] = $configuration->$param;
			}
		}
	}

	public function setRequestConfiguration(Vidiun_Client_Type_RequestConfiguration $configuration)
	{
		$params = get_class_vars('Vidiun_Client_Type_RequestConfiguration');
		foreach($params as $param)
		{
			if(is_null($configuration->$param))
			{
				if(isset($this->requestConfiguration[$param]))
				{
					unset($this->requestConfiguration[$param]);
				}
			}
			else
			{
				$this->requestConfiguration[$param] = $configuration->$param;
			}
		}
	}

	/**
	 * Add parameter to array of parameters that is passed by reference
	 *
	 * @param array $params
	 * @param string $paramName
	 * @param string $paramValue
	 */
	public function addParam(array &$params, $paramName, $paramValue)
	{
		if ($paramValue === null)
			return;

		if ($paramValue instanceof VidiunNull) {
			$params[$paramName . '__null'] = '';
			return;
		}

		if(is_object($paramValue) && $paramValue instanceof Vidiun_Client_ObjectBase)
		{
			$params[$paramName] = array(
				'objectType' => $paramValue->getVidiunObjectType()
			);

			foreach($paramValue as $prop => $val)
				$this->addParam($params[$paramName], $prop, $val);

			return;
		}

		if(is_bool($paramValue))
		{
			$params[$paramName] = $paramValue;
			return;
		}

		if(!is_array($paramValue))
		{
			$params[$paramName] = (string)$paramValue;
			return;
		}

		$params[$paramName] = array();
		if ($paramValue)
		{
			foreach($paramValue as $subParamName => $subParamValue)
				$this->addParam($params[$paramName], $subParamName, $subParamValue);
		}
		else
		{
			$params[$paramName]['-'] = '';
		}
	}

	/**
	 * @param mixed $value
	 * @return mixed
	 */
	public function jsObjectToClientObject($value)
	{
		if(is_array($value))
		{
			foreach($value as &$item)
			{
				$item = $this->jsObjectToClientObject($item);
			}
		}

		if(is_object($value))
		{
			if(isset($value->message) && isset($value->code))
			{
				if($this->isMultiRequest)
				{
					if(isset($value->args))
					{
						$value->args = (array) $value->args;
					}
					return (array) $value;
				}
				throw $this->getVidiunAPIException($value->message, $value->code, $value->args);
			}

			if(!isset($value->objectType))
			{
				throw $this->getVidiunClientException("Response format not supported - objectType is required for all objects", Vidiun_Client_ClientException::ERROR_FORMAT_NOT_SUPPORTED);
			}

			$objectType = $value->objectType;
			$object = new $objectType();
			$attributes = get_object_vars($value);
			foreach($attributes as $attribute => $attributeValue)
			{
				if($attribute === 'objectType')
				{
					continue;
				}

				$object->$attribute = $this->jsObjectToClientObject($attributeValue);
			}

			$value = $object;
		}

		return $value;
	}

	/**
	 * Encodes objects
	 * @param mixed $value
	 * @return string
	 */
	public function jsonEncode($value)
	{
		return json_encode($this->unsetNull($value));
	}

	protected function unsetNull($object)
	{
		if(!is_array($object) && !is_object($object))
			return $object;

		if(is_object($object) && $object instanceof MultiRequestSubResult)
			return "$object";

		$array = (array) $object;
		foreach($array as $key => $value)
		{
			if(is_null($value))
			{
				unset($array[$key]);
			}
			else
			{
				$array[$key] = $this->unsetNull($value);
			}
		}

		if(is_object($object) && $object instanceof Vidiun_Client_ObjectBase)
			$array['objectType'] = $object->getVidiunObjectType();

		return $array;
	}

	/**
	 * Validate the result object and throw exception if its an error
	 *
	 * @param object $resultObject
	 */
	public function throwExceptionIfError($resultObject)
	{
		if ($this->isError($resultObject))
		{
			throw $this->getVidiunAPIException($resultObject["message"], $resultObject["code"], $resultObject["args"]);
		}
	}

	/**
	 * Checks whether the result object is an error
	 *
	 * @param object $resultObject
	 */
	public function isError($resultObject)
	{
		return (is_array($resultObject) && isset($resultObject["message"]) && isset($resultObject["code"]));
	}

	/**
	 * Validate that the passed object type is of the expected type
	 *
	 * @param any $resultObject
	 * @param string $objectType
	 */
	public function validateObjectType($resultObject, $objectType)
	{
		$knownNativeTypes = array("boolean", "integer", "double", "string");
		if (is_null($resultObject) ||
			( in_array(gettype($resultObject) ,$knownNativeTypes) &&
				in_array($objectType, $knownNativeTypes) ) )
		{
			return;// we do not check native simple types
		}
		else if ( is_object($resultObject) )
		{
			if (!($resultObject instanceof $objectType))
			{
				throw $this->getVidiunClientException("Invalid object type - not instance of $objectType", Vidiun_Client_ClientException::ERROR_INVALID_OBJECT_TYPE);
			}
		}
		else if(class_exists($objectType) && is_subclass_of($objectType, 'Vidiun_Client_EnumBase'))
		{
			$enum = new ReflectionClass($objectType);
			$values = array_map('strval', $enum->getConstants());
			if(!in_array($resultObject, $values))
			{
				throw $this->getVidiunClientException("Invalid enum value", Vidiun_Client_ClientException::ERROR_INVALID_ENUM_VALUE);
			}
		}
		else if(gettype($resultObject) !== $objectType)
		{
			throw $this->getVidiunClientException("Invalid object type", Vidiun_Client_ClientException::ERROR_INVALID_OBJECT_TYPE);
		}
	}


	public function startMultiRequest()
	{
		$this->multiRequestReturnType = array();
	}

	public function doMultiRequest()
	{
		$xmlData = $this->doQueue();
		if(is_null($xmlData))
			return null;

		$xml = new SimpleXMLElement($xmlData);
		$items = $xml->result->children();
		$ret = array();
		$i = 0;
		foreach($items as $item) {
			$error = $this->checkIfError($item, false);
			if($error)
				$ret[] = $error;
			else if($item->objectType)
				$ret[] = Vidiun_Client_ParseUtils::unmarshalObject($item, $this->multiRequestReturnType[$i]);
			else if($item->item)
				$ret[] = Vidiun_Client_ParseUtils::unmarshalArray($item, $this->multiRequestReturnType[$i]);
			else
				$ret[] = Vidiun_Client_ParseUtils::unmarshalSimpleType($item);
			$i++;
		}

		$this->resetRequest();
		return $ret;
	}

	public function isMultiRequest()
	{
		return !is_null($this->multiRequestReturnType);
	}

	public function getMultiRequestQueueSize()
	{
		return count($this->callsQueue);
	}

	public function getMultiRequestResult()
	{
		return new Vidiun_Client_MultiRequestSubResult($this->getMultiRequestQueueSize() . ':result');
	}

	/**
	 * @param string $msg
	 */
	protected function log($msg)
	{
		if ($this->shouldLog)
			$this->config->getLogger()->log($msg);
	}

	/**
	 * Return a list of parameter used to a new start debug on the destination server api
	 * @link http://kb.zend.com/index.php?View=entry&EntryID=434
	 * @param $url
	 */
	protected function getZendDebuggerParams($url)
	{
		$params = array();
		$passThruParams = array('debug_host',
			'debug_fastfile',
			'debug_port',
			'start_debug',
			'send_debug_header',
			'send_sess_end',
			'debug_jit',
			'debug_stop',
			'use_remote');

		foreach($passThruParams as $param)
		{
			if (isset($_COOKIE[$param]))
				$params[$param] = $_COOKIE[$param];
		}

		$params['original_url'] = $url;
		$params['debug_session_id'] = microtime(true); // to create a new debug session

		return $params;
	}

	public function generateSession($adminSecretForSigning, $userId, $type, $partnerId, $expiry = 86400, $privileges = '')
	{
		$rand = rand(0, 32000);
		$expiry = time()+$expiry;
		$fields = array (
			$partnerId ,
			$partnerId ,
			$expiry ,
			$type,
			$rand ,
			$userId ,
			$privileges
		);
		$info = implode ( ";" , $fields );

		$signature = $this->hash ( $adminSecretForSigning , $info );
		$strToHash =  $signature . "|" . $info ;
		$encoded_str = base64_encode( $strToHash );

		return $encoded_str;
	}

	public static function generateSessionV2($adminSecretForSigning, $userId, $type, $partnerId, $expiry, $privileges)
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

		// build fields string
		$fieldsStr = http_build_query($fields, '', '&');
		$rand = '';
		for ($i = 0; $i < self::RANDOM_SIZE; $i++)
			$rand .= chr(rand(0, 0xff));
		$fieldsStr = $rand . $fieldsStr;
		$fieldsStr = sha1($fieldsStr, true) . $fieldsStr;

		// encrypt and encode
		$encryptedFields = self::aesEncrypt($adminSecretForSigning, $fieldsStr);
		$decodedVs = "v2|{$partnerId}|" . $encryptedFields;
		return str_replace(array('+', '/'), array('-', '_'), base64_encode($decodedVs));
	}

	protected static function aesEncrypt($key, $message)
	{
		$iv = str_repeat("\0", 16);    // no need for an IV since we add a random string to the message anyway
		$key = substr(sha1($key, true), 0, 16);
		if (function_exists('mcrypt_encrypt')) {
			return mcrypt_encrypt(
				MCRYPT_RIJNDAEL_128,
				$key,
				$message,
				MCRYPT_MODE_CBC,
				$iv
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
				$iv
			);
		}
	}

	private function hash ( $salt , $str )
	{
		return sha1($salt.$str);
	}

	/**
	 * @return VidiunNull
	 */
	public static function getVidiunNullValue()
	{
		return VidiunNull::getInstance();
	}


	public function getVidiunAPIException($errorMsg, $errorCode, $args)
	{
		return new Vidiun_Client_Exception($errorMsg, $errorCode, $args);
	}

	public function getVidiunClientException( $error, $errorCode)
	{
		return new Vidiun_Client_ClientException($error, $errorCode);
	}

	public function checkIfError(\SimpleXMLElement $xml, $throwException = true)
	{
		if(($xml->error) && (count($xml->children()) == 1))
		{
			$code = "{$xml->error->code}";
			$message = "{$xml->error->message}";
			$arguments = Vidiun_Client_ParseUtils::unmarshalArray($xml->error->args, 'VidiunApiExceptionArg');
			if($throwException)
				throw $this->getVidiunAPIException($message, $code, $arguments);
			else
				return $this->getVidiunAPIException($message, $code, $arguments);
		}
	}
}

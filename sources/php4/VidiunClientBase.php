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

define("VIDIUN_SERVICE_FORMAT_JSON", 1);
define("VIDIUN_SERVICE_FORMAT_XML",  2);
define("VIDIUN_SERVICE_FORMAT_PHP",  3);

class VidiunClientBase
{
	/**
	 * @var string
	 */
	var $apiVersion = null;

	/**
	 * @var VidiunConfiguration
	 */
	var $config;

	/**
	 * @var string
	 */
	var $vs;

	/**
	 * @var boolean
	 */
	var $shouldLog = false;

	/**
	 * @var string
	 */
	var $error;

	/**
	 * Vidiun client constuctor, expecting configuration object
	 *
	 * @param VidiunConfiguration $config
	 */
	function VidiunClientBase(/*VidiunConfiguration*/ $config)
	{
		$this->config = $config;

		$logger = $this->config->getLogger();
		if (isset($logger))
		{
			$this->shouldLog = true;
		}
	}

	function callService($service, $action, $params)
	{
		$startTime = microtime(true);
		$this->error = null;

		$this->log("service url: [" . $this->config->serviceUrl . "]");
		$this->log("trying to call service: [".$service.".".$action."] using session: [" .$this->vs . "]");

		// append the basic params
		$this->addParam($params, "apiVersion", $this->apiVersion);

		// in start session partner id is optional (default -1). if partner id was not set, use the one in the config
		if (!isset($params["partnerId"]) || $params["partnerId"] === -1)
	        $this->addParam($params, "partnerId", $this->config->partnerId);

		$this->addParam($params, "format", $this->config->format);
		$this->addParam($params, "clientTag", $this->config->clientTag);
		$this->addParam($params, "vs", $this->vs);

		$url = $this->config->serviceUrl."/api_v3/service/$service/action/$action";
		$this->log("full reqeust url: [" . $url . "]");

		// flatten sub arrays (the objects)
		$newParams = array();
		foreach($params as $key => $val)
		{
			if (is_array($val))
			{
				if ($val)
				{
					foreach($val as $subKey => $subVal)
					{
						$newParams[$key.":".$subKey] = $subVal;
					}
				}
				else
				{
					$newParams[$key.":-"] = "";
				}
			}
			else
			{
				 $newParams[$key] = $val;
			}
		}

		$signature = $this->signature($newParams);
		$this->addParam($params, "vidsig", $signature);

	    $this->log(print_r($newParams, true));

		list($postResult, $error) = $this->doHttpRequest($url, $newParams);

		if ($error)
		{
			$this->setError(array("code" => 0, "message" => $error));
		}
		else
		{
			$this->log("result (serialized): " . $postResult);

			if ($this->config->format == VIDIUN_SERVICE_FORMAT_PHP)
			{
				$result = @unserialize($postResult);

				if ($result === false && serialize(false) !== $postResult)
				{
					$this->setError(array("code" => 0, "message" => "failed to serialize server result"));
				}
				$dump = print_r($result, true);
				$this->log("result (object dump): " . $dump);
			}
			else
			{
				$this->setError(array("code" => 0, "message" => "unsupported format"));
			}
		}

		$endTime = microtime (true);

		$this->log("execution time for service [".$service.".".$action."]: [" . ($endTime - $startTime) . "]");

		return $result;
	}

	function signature($params)
	{
		ksort($params);
		$str = "";
		foreach ($params as $k => $v)
		{
			$str .= $k.$v;
		}
		return md5($str);
	}

	function doHttpRequest($url, $params, $optionalHeaders = null)
	{
		if (function_exists('curl_init'))
			return $this->doCurl($url, $params);
		else
			return $this->doPostRequest($url, $params, $optionalHeaders);
	}

	function doCurl($url, $params)
	{
		$ch = curl_init();
		curl_setopt($ch, CURLOPT_URL, $url );
		curl_setopt($ch, CURLOPT_POSTFIELDS, $params);
		curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
		curl_setopt($ch, CURLOPT_USERAGENT, '');
		curl_setopt($ch, CURLOPT_TIMEOUT, 120 );
		if (defined('CURLOPT_ENCODING'))
			curl_setopt($ch, CURLOPT_ENCODING, 'gzip,deflate');

		$result = curl_exec($ch);
		$curlError = curl_error($ch);
		curl_close($ch);
		return array($result, $curlError);
	}

	function doPostRequest($url, $data, $optionalHeaders = null)
	{
		$formattedData = $this->httpParseQuery($data);

		if (!function_exists('fsockopen'))
		{
			$this->setError(array("code" => 0, "message" => "fsockopen is missing"));
			return;
		}
		$start = strpos($url,'//')+2;
		$end = strpos($url,'/',$start);
		$host = substr($url, $start, $end-$start);
		$domain = substr($url,$end);
		$fp = fsockopen($host, 80);
		if(!$fp) return null;
		fputs ($fp,"POST $domain HTTP/1.0\n"); // 1.0 beacause we don't want to support chunked transfer encoding
		fputs ($fp,"Host: $host\n");
		if ($optionalHeaders) {
			fputs($fp, $optionalHeaders);
		}
		fputs ($fp,"Content-type: application/x-www-form-urlencoded\n");
		fputs ($fp,"Content-length: ".strlen($formattedData)."\n\n");
		fputs ($fp,"$formattedData\n\n");

		$response = "";
		while(!feof($fp)) {
			$response .= fread($fp, 32768);
		}

		$pos = strpos($response, "\r\n\r\n");
		if ($pos)
			$response = substr($response, $pos + 4);
		else
			$response = "";

		fclose ($fp);
		return array($response, '');
	}

	function httpParseQuery($array = null, $convention = "%s")
	{
		if (!$array || count($array) == 0)
	        return '';

		$query = '';

		foreach($array as $key => $value)
		{
		    if(is_array($value))
		    {
				$new_convention = sprintf($convention, $key) . '[%s]';
			    $query .= $this->httpParseQuery($value, $new_convention);
			}
			else
			{
			    $key = urlencode($key);
			    $value = urlencode($value);

			    $query .= sprintf($convention, $key) . "=$value&";
            }
		}

		return $query;
	}

	function getVs()
	{
		return $this->vs;
	}

	function setVs($vs)
	{
		$this->vs = $vs;
	}

	function addParam(&$params, $paramName, $paramValue)
	{
		if ($paramValue !== null)
		{
			$params[$paramName] = $paramValue;
		}
	}

	function checkForError($resultObject)
	{
		if (is_array($resultObject) && isset($resultObject["message"]) && isset($resultObject["code"]))
		{
			$this->setError(array("code" => $resultObject["code"], "message" => $resultObject["message"]));
		}
	}

	function validateObjectType($resultObject, $objectType)
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
			if (!(is_a($resultObject ,$objectType))){
				$this->setError(array("code" => 0, "message" => "Invalid object type"));
			}
		}
		else if(gettype($resultObject) !== $objectType)
		{
			$this->setError(array("code" => 0, "message" => "Invalid object type"));
		}
	}


	function log($msg)
	{
		if ($this->shouldLog)
		{
		    $logger = $this->config->getLogger();
			$logger->log($msg);
		}
	}

	function setError($error)
	{
	    if ($this->error == null) // this is needed so only the first error will be set, and not the last
	    {
	        $this->error = $error;
	    }
	}
}


/**
 * Abstract base class for all client services
 *
 */
class VidiunServiceBase
{
	var $client;

	/**
	 * Initialize the service keeping reference to the VidiunClient
	 *
	 * @param VidiunClient $client
	 */
	function VidiunServiceBase(/*VidiunClient*/ &$client)
	{
		$this->client = &$client;
	}
}

/**
 * Abstract base class for all client objects
 *
 */
class VidiunObjectBase
{
	function addIfNotNull(&$params, $paramName, $paramValue)
	{
		if ($paramValue !== null)
		{
			$params[$paramName] = $paramValue;
		}
	}

	function toParams()
	{
		$params = array();
		$params["objectType"] = get_class($this);
	    foreach($this as $prop => $val)
		{
			$this->addIfNotNull($params, $prop, $val);
		}
		return $params;
	}
}

class VidiunConfiguration
{
	var $logger;

	var $serviceUrl    = "http://www.vidiun.com/";
	var $partnerId     = null;
	var $format        = 3;
	var $clientTag 	   = "php4:@DATE@";

	/**
	 * Constructs new Vidiun configuration object
	 *
	 */
	function VidiunConfiguration($partnerId)
	{
	    $this->partnerId = $partnerId;
	}

	/**
	 * Set logger to get vidiun client debug logs
	 *
	 * @param IVidiunLogger $log
	 */
	function setLogger($log)
	{
		$this->logger = $log;
	}

	/**
	 * Gets the logger (Internal client use)
	 *
	 * @return IVidiunLogger
	 */
	function getLogger()
	{
		return $this->logger;
	}
}
?>

#!/usr/bin/php
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

require_once(dirname(__file__) . '/lib/VidiunCommandLineParser.php');

function print_r_reverse($in) {
    $lines = explode("\n", trim($in));
    if (trim($lines[0]) != 'Array') {
        // bottomed out to something that isn't an array
        return $in;
    } else {
        // this is an array, lets parse it
        if (preg_match('/(\s{5,})\(/', $lines[1], $match)) {
            // this is a tested array/recursive call to this function
            // take a set of spaces off the beginning
            $spaces = $match[1];
            $spaces_length = strlen($spaces);
            $lines_total = count($lines);
            for ($i = 0; $i < $lines_total; $i++) {
                if (substr($lines[$i], 0, $spaces_length) == $spaces) {
                    $lines[$i] = substr($lines[$i], $spaces_length);
                }
            }
        }
        array_shift($lines); // Array
        array_shift($lines); // (
        array_pop($lines); // )
        $in = implode("\n", $lines);
        // make sure we only match stuff with 4 preceding spaces (stuff for this array and not a nested one)
        preg_match_all('/^\s{4}\[(.+?)\] \=\> ?/m', $in, $matches, PREG_OFFSET_CAPTURE | PREG_SET_ORDER);
        $pos = array();
        $previous_key = '';
        $in_length = strlen($in);
        // store the following in $pos:
        // array with key = key of the parsed array's item
        // value = array(start position in $in, $end position in $in)
        foreach ($matches as $match) {
            $key = $match[1][0];
            $start = $match[0][1] + strlen($match[0][0]);
            $pos[$key] = array($start, $in_length);
            if ($previous_key != '') $pos[$previous_key][1] = $match[0][1] - 1;
            $previous_key = $key;
        }
        $ret = array();
        foreach ($pos as $key => $where) {
            // recursively see if the parsed out value is an array too
            $ret[$key] = print_r_reverse(substr($in, $where[0], $where[1] - $where[0]));
        }
        return $ret;
    }
}

function parseMultirequest($parsedParams)
{
	$paramsByRequest = array();
	foreach ($parsedParams as $paramName => $paramValue)
	{
		$explodedName = explode(':', $paramName);
		if (count($explodedName) <= 1 || !is_numeric($explodedName[0]))
		{
			$requestIndex = 'common';
		}
		else
		{		
			$requestIndex = (int)$explodedName[0];
			$paramName = implode(':', array_slice($explodedName, 1));
		}
		
		if (!array_key_exists($requestIndex, $paramsByRequest))
		{
			$paramsByRequest[$requestIndex] = array();
		}
		$paramsByRequest[$requestIndex][$paramName] = $paramValue;
	}
	
	if (isset($paramsByRequest['common']))
	{
		foreach ($paramsByRequest as $requestIndex => &$curParams)
		{
			if ($requestIndex === 'common')
				continue;
			$curParams = array_merge($curParams, $paramsByRequest['common']);
		}
		unset($paramsByRequest['common']);
	}
	vsort($paramsByRequest);
	return $paramsByRequest;
}

function genVidcliCommand($parsedParams)
{
	if (!isset($parsedParams['service']))
		return 'Error: service not defined';
	$service = $parsedParams['service'];
	unset($parsedParams['service']);

	if (!isset($parsedParams['action']))
		return 'Error: action not defined';
	$action = $parsedParams['action'];
	unset($parsedParams['action']);
	
	$res = "vidcli -x {$service} {$action}";

	vsort($parsedParams);
	foreach ($parsedParams as $param => $value)
	{
		$curParam = "{$param}={$value}";
		if (!preg_match('/^[a-zA-Z0-9\:_\-,=\.]+$/', $curParam))
			if (strpos($curParam, "'") === false)
				$res .= " '{$curParam}'";
			else
				$res .= " \"{$curParam}\"";
		else
			$res .= " {$curParam}";
	}
	return $res;
}

function flattenArray($input, $prefix)
{
	$result = array();
	foreach ($input as $key => $value)
	{
		if (is_array($value))
		{
			$result = array_merge($result, flattenArray($value, $prefix . "$key:"));
		}
		else
		{
			$result[$prefix . $key] = $value;
		}
	}
	return $result;
}

function generateOutput($parsedParams, $multireqMode)
{
	$parsedParams = flattenArray($parsedParams, '');

	if (isset($parsedParams['service']) && $parsedParams['service'] == 'multirequest')
	{
		if ($multireqMode == 'multi')
		{
			unset($parsedParams['service']);
			unset($parsedParams['action']);
			$requestByParams = parseMultirequest($parsedParams);
			foreach ($requestByParams as $curParams)
			{
				$curCmd = genVidcliCommand($curParams);
				echo $curCmd . "\n";
			}
			return;
		}
		$parsedParams['action'] = 'null';
	}
	
	$curCmd = genVidcliCommand($parsedParams);
	echo $curCmd . "\n";
}

// parse the command line
$commandLineSwitches = array(
		array(VidiunCommandLineParser::SWITCH_NO_VALUE, 's', 'single', 'Generate a single command for multirequest'),
		array(VidiunCommandLineParser::SWITCH_NO_VALUE, 'h', 'help', 'Prints usage information'),
);

$options = VidiunCommandLineParser::parseArguments($commandLineSwitches);
if (isset($options['help']))
{
	$usage = "Usage: logToCli [switches]\nOptions:\n";
	$usage .= VidiunCommandLineParser::getArgumentsUsage($commandLineSwitches);
	echo $usage; 
	exit(1);
}

$multireqMode = 'multi';
if (isset($options['single']))
	$multireqMode = 'single';

// read parameters from stdin
$f = fopen('php://stdin', 'r');
$logSection = '';
$lastTrimmedLine = '';
for (;;)
{
	$line = fgets($f);
	$trimmedLine = trim($line);
	if ((!$trimmedLine && $lastTrimmedLine != ')') || 
		$trimmedLine == ']')
		break;
	$lastTrimmedLine = $trimmedLine;
	$logSection .= $line;
}
fclose($f);

// parse the log section
$logSection = str_replace("\r", '', $logSection);
$arrayPos = strpos($logSection, 'Array');
$curlPos = strpos($logSection, 'curl: ');
if ($arrayPos !== false)
{
	$logSection = substr($logSection, $arrayPos);
	$parsedParams = print_r_reverse($logSection);
	if (!is_array($parsedParams))
	{
		echo 'Error: failed to parse action parameters';
		exit(1);
	}
}
else if ($curlPos !== false)
{
	$parsedParams = array();

	// post body
	$postPos = strpos($logSection, 'post: ');
	if ($postPos !== false)
	{
		$postBody = explode("\n", substr($logSection, $postPos + 6));
		$postBody = reset($postBody);
		$parsedParams = array_merge($parsedParams, json_decode($postBody, true));
	}

	$url = explode("\n", substr($logSection, $curlPos + 6));
	$url = reset($url);
	$parsedUrl = parse_url(trim($url));
	
	// query string
	if (isset($parsedUrl['query']))
	{
		$curParams = null;
		parse_str($parsedUrl['query'], $curParams);
		$parsedParams = array_merge($parsedParams, $curParams);
	}

	// url path
	$urlPath = $parsedUrl['path'];
	$apiPos = strpos($urlPath, '/api_v3/');
	if ($apiPos !== false)
	{
		$curParams = substr($urlPath, $apiPos + 8);
		if (substr($curParams, 0, 10) == 'index.php/')
		{
			$curParams = substr($curParams, 10);
		}
		
		$pathParts = explode('/', $curParams);
		reset($pathParts);
		while(current($pathParts))
		{
			$key = each($pathParts);
			$value = each($pathParts);
			$parsedParams[$key['value']] = $value['value'];
		}
	}
}
else 
{
	echo 'Error: failed to parse log section (missing "Array")';
	exit(1);
}

// output the result
generateOutput($parsedParams, $multireqMode);

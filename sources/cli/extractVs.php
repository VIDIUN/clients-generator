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
require_once(dirname(__file__) . '/lib/VidiunSession.php');

function formatTimeInterval($secs)
{
	$bit = array(
		' year'   => intval($secs / 31556926),
		' month'  => $secs / 2628000 % 12,
		' day'    => $secs / 86400 % 30,
		' hour'   => $secs / 3600 % 24,
		' minute' => $secs / 60 % 60,
		' second' => $secs % 60
	);

	foreach($bit as $k => $v)
	{
		if($v > 1)
		{
			$ret[] = $v . $k . 's';
		}
		else if($v == 1)
		{
			$ret[] = $v . $k;
		}
	}
	
	$ret = array_slice($ret, 0, 2);		// don't care about more than 2 levels
	array_splice($ret, count($ret) - 1, 0, 'and');

	return join(' ', $ret);
}

function formatVs($vsObj, $fieldNames)
{
	$printDelim = false;
	if (isset($fieldNames['hash']))
	{
		echo str_pad('Sig', 20) . $vsObj->hash . "\n";
		unset($fieldNames['hash']);
		$printDelim = true;
	}
	if (isset($fieldNames['real_str']))
	{
		echo str_pad('Fields', 20) . $vsObj->real_str . "\n";
		unset($fieldNames['real_str']);
		$printDelim = true;
	}
	if ($printDelim)
	{
		echo "---\n";
	}
	
	foreach ($fieldNames as $fieldName)
	{
		echo str_pad($fieldName, 20) . $vsObj->$fieldName;
		if ($fieldName == 'valid_until')
		{
			$currentTime = time();
			echo ' = ' . date('Y-m-d H:i:s', $vsObj->valid_until);
			if ($currentTime >= $vsObj->valid_until)
			{
				echo ' (expired ' . formatTimeInterval($currentTime - $vsObj->valid_until) . ' ago';
			}
			else
			{
				echo ' (will expire in ' . formatTimeInterval($vsObj->valid_until - $currentTime);
			}
			echo ')';
		}
		echo "\n";
	}
}

function formatVsTable($vsObj, $fieldNames)
{
	$result = array();
	foreach ($fieldNames as $fieldName)
	{
		$result[] = $vsObj->$fieldName;
	}
	echo implode("\t", $result) . "\n";
}

$commandLineSwitches = array(
	array(VidiunCommandLineParser::SWITCH_NO_VALUE, 'i', 'stdin', 'Read input from stdin'),
	array(VidiunCommandLineParser::SWITCH_NO_VALUE, 'p', 'partner-id', 'Print the partner id'),
	array(VidiunCommandLineParser::SWITCH_NO_VALUE, 't', 'type', 'Print the session type'),
	array(VidiunCommandLineParser::SWITCH_NO_VALUE, 'u', 'user', 'Print the user name'),
	array(VidiunCommandLineParser::SWITCH_NO_VALUE, 'e', 'expiry', 'Print the session expiry'),
	array(VidiunCommandLineParser::SWITCH_NO_VALUE, 'v', 'privileges', 'Print the privileges'),
);

// parse command line
$options = VidiunCommandLineParser::parseArguments($commandLineSwitches);
$arguments = VidiunCommandLineParser::stripCommandLineSwitches($commandLineSwitches, $argv);

VidiunSecretRepository::init();

if (!$arguments && !isset($options['stdin']))
{
	$usage = "Usage: extractVs [switches] [<vs>]\nOptions:\n";
	$usage .= VidiunCommandLineParser::getArgumentsUsage($commandLineSwitches);
	die($usage);
}

$fieldNames = array();
if (isset($options['partner-id']))
{
	$fieldNames[] = 'partner_id';
}
if (isset($options['type']))
{
	$fieldNames[] = 'type';
}
if (isset($options['user']))
{
	$fieldNames[] = 'user';
}
if (isset($options['expiry']))
{
	$fieldNames[] = 'valid_until';
}
if (isset($options['privileges']))
{
	$fieldNames[] = 'privileges';
}
if (!$fieldNames)
{
	$fieldNames = array('hash','real_str','partner_id','partner_pattern','valid_until','type','rand','user','privileges','master_partner_id','additional_data');
}

if (!isset($options['stdin']))
{
	$vs = reset($arguments);
	$vsObj = VidiunSession::getVsObject($vs);
	if (!$vsObj)
		die("Failed to parse vs {$vs}\n");
	formatVs($vsObj, $fieldNames);
	die;
}

$f = fopen('php://stdin', 'r');
for (;;)
{
	$line = fgets($f);
	if (!$line)
	{
		break;
	}
	$vs = trim($line);
	$vsObj = VidiunSession::getVsObject($vs);
	if ($vsObj)
	{
		formatVsTable($vsObj, $fieldNames);
	}
	else
	{
		echo "Failed to parse vs {$vs}\n";
	}
}
fclose($f);

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

$commandLineSwitches = array(
	array(VidiunCommandLineParser::SWITCH_REQUIRES_VALUE, 'v', 'version', 'Session version (1/2)'),
	array(VidiunCommandLineParser::SWITCH_REQUIRES_VALUE, 't', 'type', 'Session type - 0=USER, 2=ADMIN'),
	array(VidiunCommandLineParser::SWITCH_REQUIRES_VALUE, 'u', 'user', 'User name'),
	array(VidiunCommandLineParser::SWITCH_REQUIRES_VALUE, 'e', 'expiry', 'Session expiry (seconds)'),
	array(VidiunCommandLineParser::SWITCH_REQUIRES_VALUE, 'p', 'privileges', 'Session privileges'),
	array(VidiunCommandLineParser::SWITCH_NO_VALUE, 'w', 'widget', 'Widget session'),
	array(VidiunCommandLineParser::SWITCH_NO_VALUE, 'b', 'bare', 'Print only the VS itself'),
);

// parse command line
$options = VidiunCommandLineParser::parseArguments($commandLineSwitches);
$arguments = VidiunCommandLineParser::stripCommandLineSwitches($commandLineSwitches, $argv);

if (!$arguments)
{
	$usage = "Usage: generateVs [switches] <partnerId>\nOptions:\n";
	$usage .= VidiunCommandLineParser::getArgumentsUsage($commandLineSwitches);
	die($usage);
}

$partnerId = $arguments[0];

VidiunSecretRepository::init();

$adminSecret = VidiunSecretRepository::getAdminSecret($partnerId);
if (!$adminSecret)
    die("Failed to get secret for partner {$partnerId}\n");

$type = (isset($options['type']) ? $options['type'] : 2);
$user = (isset($options['user']) ? $options['user'] : 'admin');
$expiry = (isset($options['expiry']) ? $options['expiry'] : 86400);
$privileges = (isset($options['privileges']) ? $options['privileges'] : 'disableentitlement');

if (isset($options['widget']))
{
	$type = 0;
	$user = '0';
	$expiry = 86400;
	$privileges = 'widget:1,view:*';
}

if (!isset($options['bare']))
	echo "vs\t";

$version = isset($options['version']) ? $options['version'] : 1;
switch ($version)
{ 
case 1:
	$vs = VidiunSession::generateVsV1($adminSecret, $user, $type, $partnerId, $expiry, $privileges, null, null);
	break;

case 2:
	$vs = VidiunSession::generateVsV2($adminSecret, $user, $type, $partnerId, $expiry, $privileges, null, null);
	break;

default:
	die("Invalid version {$version}\n");
}
	
echo $vs;

if (!isset($options['bare']))
	echo "\n";

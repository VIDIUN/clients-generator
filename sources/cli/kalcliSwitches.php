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

// extra value, short switch, long switch, description
$commandLineSwitches = array(
	array(VidiunCommandLineParser::SWITCH_NO_VALUE, 'i', 'include', 'Include output headers as well as the response body'),
	array(VidiunCommandLineParser::SWITCH_NO_VALUE, 'I', 'head', 'Output only response headers'),
	array(VidiunCommandLineParser::SWITCH_NO_VALUE, 'l', 'log', 'Output only the API execution log'),
	array(VidiunCommandLineParser::SWITCH_NO_VALUE, 's', 'https', 'Use https transport'),
	array(VidiunCommandLineParser::SWITCH_NO_VALUE, 't', 'time', 'Output request execution time'),
	array(VidiunCommandLineParser::SWITCH_NO_VALUE, 'g', 'get', 'Use GET instead of POST'),
	array(VidiunCommandLineParser::SWITCH_NO_VALUE, 'v', 'insecure', 'Ignore ssl certificate errors'),
	array(VidiunCommandLineParser::SWITCH_NO_VALUE, 'x', 'no-stdin', 'Disable reading of parameters from standard input'),
	array(VidiunCommandLineParser::SWITCH_NO_VALUE, 'X', 'stdin', 'Force reading of parameters from standard input'),
	array(VidiunCommandLineParser::SWITCH_NO_VALUE, 'R', 'raw', 'Disable parsing of the response (useful for serve actions)'),
	array(VidiunCommandLineParser::SWITCH_NO_VALUE, 'n', 'no-renew', 'Disable automatic Vidiun session renewals'),
	array(VidiunCommandLineParser::SWITCH_NO_VALUE, 'c', 'curl', 'Generate curl command line instead of executing the call'),
	array(VidiunCommandLineParser::SWITCH_NO_VALUE, 'L', 'location', 'Follow redirects'),
	
	array(VidiunCommandLineParser::SWITCH_REQUIRES_VALUE, 'H', 'header', 'Add a request header'),
	array(VidiunCommandLineParser::SWITCH_REQUIRES_VALUE, 'u', 'url', 'Set the API service url'),
	array(VidiunCommandLineParser::SWITCH_REQUIRES_VALUE, 'r', 'range', 'Retrieve a byte range'),
	array(VidiunCommandLineParser::SWITCH_REQUIRES_VALUE, 'p', 'param-name', 'Output the response in vidcli input format with the given parameter name'),
	);

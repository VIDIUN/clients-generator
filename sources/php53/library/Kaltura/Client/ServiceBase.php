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

/**
 * @namespace
 */
namespace Vidiun\Client;

/**
 * Abstract base class for all client services
 *  
 * @package Vidiun
 * @subpackage Client
 */
abstract class ServiceBase
{
	/**
	 * @var \Vidiun\Client\Client
	 */
	protected $client;
	
	/**
	 * Initialize the service keeping reference to the \Vidiun\Client\Client
	 *
	 * @param \Vidiun\Client\Client $client
	 */
	public function __construct(Client $client = null)
	{
		$this->client = $client;
	}
						
	/**
	 * @param \Vidiun\Client\Client $client
	 */
	public function setClient(Client $client)
	{
		$this->client = $client;
	}
						
	/**
	 * @return \Vidiun\Client\Client $client
	 */
	public function getClient()
	{
		return $this->client;
	}
}

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
 * Abstract base class for all client objects
 * 
 * @package Vidiun
 * @subpackage Client
 */
abstract class Vidiun_Client_ObjectBase
{
	/**
	 * @var array
	 */
	public $relatedObjects;
	
	abstract public function getVidiunObjectType();
	
	public function __construct(SimpleXMLElement $xml = null)
	{
		if(is_null($xml))
			return;
		
		if(count($xml->relatedObjects))
		{
			if(empty($xml->relatedObjects))
				$this->relatedObjects = array();
			else
				$this->relatedObjects = Vidiun_Client_ParseUtils::unmarshalMap($xml->relatedObjects, "VidiunListResponse");
		}
	}
	
	protected function addIfNotNull(&$params, $paramName, $paramValue)
	{
		if ($paramValue !== null)
		{
			if($paramValue instanceof Vidiun_Client_ObjectBase)
			{
				$params[$paramName] = $paramValue->toParams();
			}
			else
			{
				$params[$paramName] = $paramValue;
			}
		}
	}
	
	public function toParams()
	{
		$params = array(
			'objectType' => $this->getVidiunObjectType()
		);
		
	    foreach($this as $prop => $val)
			$this->addIfNotNull($params, $prop, $val);
			
		return $params;
	}
}

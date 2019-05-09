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
package com.vidiun.client;

import java.io.Serializable;
import java.util.HashMap;

import org.w3c.dom.Element;
import org.w3c.dom.Node;
import org.w3c.dom.NodeList;

import com.vidiun.client.types.VidiunListResponse;
import com.vidiun.client.utils.ParseUtils;

/**
 * Ancestor class for all of the generated classes in the com.vidiun.client.types package.
 * 
 * @author jpotts
 *
 */
@SuppressWarnings("serial")
public class VidiunObjectBase implements Serializable {
    public HashMap<String, VidiunListResponse> relatedObjects;

    public VidiunObjectBase() {
    }
    
    public VidiunObjectBase(Element node) throws VidiunApiException {
        NodeList childNodes = node.getChildNodes();
        for (int i = 0; i < childNodes.getLength(); i++) {
            Node aNode = childNodes.item(i);
            String nodeName = aNode.getNodeName();
            if (nodeName.equals("relatedObjects")) {
                this.relatedObjects = ParseUtils.parseMap(VidiunListResponse.class, aNode);
            } 
        }
    }
    
	public VidiunParams toParams() throws VidiunApiException {
		return new VidiunParams();
	}
	
}

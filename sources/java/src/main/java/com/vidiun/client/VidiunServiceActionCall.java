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

/**
 * A VidiunServiceActionCall is what the client queues to represent a request to the Vidiun server.
 * 
 * @author jpotts
 *
 */
public class VidiunServiceActionCall {
	private String service;
    private String action;
    private VidiunParams params;
    private VidiunFiles files;
    
    public VidiunServiceActionCall(String service, String action, VidiunParams vparams) {
        this(service, action, vparams, new VidiunFiles());
    }

    public VidiunServiceActionCall(String service, String action, VidiunParams vparams, VidiunFiles vfiles) {
        this.service = service;
        this.action = action;
        this.params = vparams;
        this.files = vfiles;
    }

    public String getService() {
        return this.service;
    }

    public String getAction() {    
    	return this.action;
    }

    public VidiunParams getParams() {
        return this.params;
    }

    public VidiunFiles getFiles() {
        return this.files;
    }

    public VidiunParams getParamsForMultiRequest(int multiRequestNumber) throws VidiunApiException {
        VidiunParams multiRequestParams = new VidiunParams();
        
        params.add("service", service);
        params.add("action", action);
        multiRequestParams.add(Integer.toString(multiRequestNumber), params);
        
        return multiRequestParams;
    }

    public VidiunFiles getFilesForMultiRequest(int multiRequestNumber) {
    	
        VidiunFiles multiRequestFiles = new VidiunFiles();
        multiRequestFiles.add(Integer.toString(multiRequestNumber), files);
        return multiRequestFiles;
    }

}

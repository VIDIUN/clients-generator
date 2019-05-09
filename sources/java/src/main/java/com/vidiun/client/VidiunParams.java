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

import java.util.ArrayList;
import java.util.HashMap;
import java.util.Iterator;

import java.io.Serializable;

import org.json.JSONException;
import org.json.JSONObject;
import org.json.JSONArray;

import com.vidiun.client.enums.VidiunEnumAsInt;
import com.vidiun.client.enums.VidiunEnumAsString;

/**
 * Helper class that provides a collection of Vidiun parameters (key-value
 * pairs).
 * 
 * @author jpotts
 * 
 */
public class VidiunParams extends JSONObject implements Serializable  {

	public String toQueryString() throws VidiunApiException {
		return toQueryString(null);
	}

	public String toQueryString(String prefix) throws VidiunApiException {

		StringBuffer str = new StringBuffer();
		Object value;
		String key;
		for (Object keyObject : keySet()) {
			key = (String) keyObject;
			if (str.length() > 0) {
				str.append("&");
			}

			try {
				value = get(key);
			} catch (JSONException e) {
				throw new VidiunApiException(e.getMessage());
			}

			if (prefix != null) {
				key = prefix + "[" + key + "]";
			}
			if (value instanceof VidiunParams) {
				str.append(((VidiunParams) value).toQueryString(key));
			} else {
				str.append(key);
				str.append("=");
				str.append(value);
			}
		}

		return str.toString();
	}

	public void add(String key, int value) throws VidiunApiException {
		if (value == VidiunParamsValueDefaults.VIDIUN_UNDEF_INT) {
			return;
		}

		if (value == VidiunParamsValueDefaults.VIDIUN_NULL_INT) {
			putNull(key);
			return;
		}

		try {
			put(key, value);
		} catch (JSONException e) {
			throw new VidiunApiException(e.getMessage());
		}
	}

	public void add(String key, long value) throws VidiunApiException {
		if (value == VidiunParamsValueDefaults.VIDIUN_UNDEF_LONG) {
			return;
		}
		if (value == VidiunParamsValueDefaults.VIDIUN_NULL_LONG) {
			putNull(key);
			return;
		}

		try {
			put(key, value);
		} catch (JSONException e) {
			throw new VidiunApiException(e.getMessage());
		}
	}

	public void add(String key, double value) throws VidiunApiException {
		if (value == VidiunParamsValueDefaults.VIDIUN_UNDEF_DOUBLE) {
			return;
		}
		if (value == VidiunParamsValueDefaults.VIDIUN_NULL_DOUBLE) {
			putNull(key);
			return;
		}

		try {
			put(key, value);
		} catch (JSONException e) {
			throw new VidiunApiException(e.getMessage());
		}
	}

	public void add(String key, String value) throws VidiunApiException {
		if (value == null) {
			return;
		}

		if (value.equals(VidiunParamsValueDefaults.VIDIUN_NULL_STRING)) {
			putNull(key);
			return;
		}

		try {
			put(key, value);
		} catch (JSONException e) {
			throw new VidiunApiException(e.getMessage());
		}
	}

	public void add(String key, VidiunObjectBase object)
			throws VidiunApiException {
		if (object == null)
			return;

		try {
			put(key, object.toParams());
		} catch (JSONException e) {
			throw new VidiunApiException(e.getMessage());
		}
	}

	public <T extends VidiunObjectBase> void add(String key, ArrayList<T> array)
			throws VidiunApiException {
		if (array == null)
			return;

		if (array.isEmpty()) {
			VidiunParams emptyParams = new VidiunParams();
			try {
				emptyParams.put("-", "");
				put(key, emptyParams);
			} catch (JSONException e) {
				throw new VidiunApiException(e.getMessage());
			}
		} else {
			JSONArray arrayParams = new JSONArray();
			for (VidiunObjectBase baseObj : array) {
				arrayParams.put(baseObj.toParams());
			}
			try {
				put(key, arrayParams);
			} catch (JSONException e) {
				throw new VidiunApiException(e.getMessage());
			}
		}
	}

	public <T extends VidiunObjectBase> void add(String key,
			HashMap<String, T> map) throws VidiunApiException {
		if (map == null)
			return;

		if (map.isEmpty()) {
			VidiunParams emptyParams = new VidiunParams();
			try {
				emptyParams.put("-", "");
				put(key, emptyParams);
			} catch (JSONException e) {
				throw new VidiunApiException(e.getMessage());
			}
		} else {
			VidiunParams mapParams = new VidiunParams();
			for (String itemKey : map.keySet()) {
				VidiunObjectBase baseObj = map.get(itemKey);
				mapParams.add(itemKey, baseObj);
			}
			try {
				put(key, mapParams);
			} catch (JSONException e) {
				throw new VidiunApiException(e.getMessage());
			}
		}
	}

	public <T extends VidiunObjectBase> void add(String key,
			VidiunParams params) throws VidiunApiException {
		try {
			if (params instanceof VidiunParams && has(key)
					&& get(key) instanceof VidiunParams) {
				VidiunParams existingParams = (VidiunParams) get(key);
				existingParams.putAll((VidiunParams) params);
			} else {
				put(key, params);
			}
		} catch (JSONException e) {
			throw new VidiunApiException(e.getMessage());
		}
	}

	public Iterable<String> keySet() {
		return new Iterable<String>() {
			@SuppressWarnings("unchecked")
			public Iterator<String> iterator() {
				return keys();
			}
		};
	}

	private void putAll(VidiunParams params) throws VidiunApiException {
		for (Object key : params.keySet()) {
			String keyString = (String) key;
			try {
				put(keyString, params.get(keyString));
			} catch (JSONException e) {
				throw new VidiunApiException(e.getMessage());
			}
		}
	}

	public void add(VidiunParams objectProperties) throws VidiunApiException {
		putAll(objectProperties);
	}

	protected void putNull(String key) throws VidiunApiException {
		try {
			put(key + "__null", "");
		} catch (JSONException e) {
			throw new VidiunApiException(e.getMessage());
		}
	}

	/**
	 * Pay attention - this function does not check if the value is null.
	 * neither it supports setting value to null.
	 */
	public void add(String key, boolean value) throws VidiunApiException {
		try {
			put(key, value);
		} catch (JSONException e) {
			throw new VidiunApiException(e.getMessage());
		}
	}

	/**
	 * Pay attention - this function does not support setting value to null.
	 */
	public void add(String key, VidiunEnumAsString value)
			throws VidiunApiException {
		if (value == null)
			return;

		add(key, value.getHashCode());
	}

	/**
	 * Pay attention - this function does not support setting value to null.
	 */
	public void add(String key, VidiunEnumAsInt value)
			throws VidiunApiException {
		if (value == null)
			return;

		add(key, value.getHashCode());
	}

	public boolean containsKey(String key) {
		return has(key);
	}

	public void clear() {
		for (Object key : keySet()) {
			remove((String) key);
		}
	}

	public VidiunParams getParams(String key) throws VidiunApiException {
		if (!has(key))
			return null;

		Object value;
		try {
			value = get(key);
		} catch (JSONException e) {
			throw new VidiunApiException(e.getMessage());
		}
		if (value instanceof VidiunParams)
			return (VidiunParams) value;

		throw new VidiunApiException("Key value [" + key
				+ "] is not instance of VidiunParams");
	}

}

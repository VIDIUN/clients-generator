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
using System;
using System.Collections.Generic;
using System.Text;
using System.IO;
using System.Threading;

namespace Vidiun
{
    class VidiunClientTester : IVidiunLogger
    {
        private const int PARTNER_ID = @PARTNER_ID@; //enter your partner id
        private const string SERVICE_URL = "@SERVICE_URL@";
        private const string OPERATOR_USERNAME = "@OPERATOR_USERNAME@";
        private const string OPERATOR_PASSWORD = "@OPERATOR_PASSWORD@";
        private const string MASTER_USERNAME = "@MASTER_USERNAME@";
        private const string MASTER_PASSWORD = "@MASTER_PASSWORD@";
        private const string MASTER_DEVICE = "@MASTER_DEVICE@";
        private const int MASTER_DEVICE_BRAND = @MASTER_DEVICE_BRAND@;


        private static string uniqueTag;
        private static string currentUserId;
        private static VidiunClient client;

        public void Log(string msg)
        {
            Console.WriteLine(msg);
        }

        static void Main(string[] args)
        {
            Console.WriteLine("Starting C# Vidiun API Client Library");
            int code = 0;
            uniqueTag = Guid.NewGuid().ToString().Replace("-", "").Substring(0, 20);

            VidiunConfiguration config = new VidiunConfiguration();
            config.ServiceUrl = SERVICE_URL;
            client = new VidiunClient(config);

            try
            {
                Login(OPERATOR_USERNAME, OPERATOR_PASSWORD);
            }
            catch (VidiunAPIException e)
            {
                Console.WriteLine("Failed Login as operator: " + e.Message);
                code = -1;
            }

            try
            {
                Login(MASTER_USERNAME, MASTER_PASSWORD, MASTER_DEVICE);
            }
            catch (VidiunAPIException e)
            {
                Console.WriteLine("Failed Login as master: " + e.Message);
                code = -1;
            }

            try
            {
                ListUserRoles();
            }
            catch (VidiunAPIException e)
            {
                Console.WriteLine("Failed ListUserRoles: " + e.Message);
                code = -1;
            }

            try
            {
                ListAssets();
            }
            catch (VidiunAPIException e)
            {
                Console.WriteLine("Failed ListAssets: " + e.Message);
                code = -1;
            }

            try
            {
                ListOttUsers();
            }
            catch (VidiunAPIException e)
            {
                Console.WriteLine("Failed ListOttUsers: " + e.Message);
                code = -1;
            }

            try
            {
                ListHouseholdUsers();
            }
            catch (VidiunAPIException e)
            {
                Console.WriteLine("Failed ListHouseholdUsers: " + e.Message);
                code = -1;
            }

            try
            {
                GetHousehold();
            }
            catch (VidiunAPIException e)
            {
                Console.WriteLine("Failed GetHousehold: " + e.Message);
                code = -1;
            }

            try
            {
                SearchCatalog();
            }
            catch (VidiunAPIException e)
            {
                Console.WriteLine("Failed SearchCatalog: " + e.Message);
                code = -1;
            }

            try
            {
                GetHouseholdDevice();
            }
            catch (VidiunAPIException e)
            {
                Console.WriteLine("Failed GetHouseholdDevice: " + e.Message);
                code = -1;
            }

            try
            {
                AddHouseholdDevice();
            }
            catch (VidiunAPIException e)
            {
                Console.WriteLine("Failed AddHouseholdDevice: " + e.Message);
                code = -1;
            }

            try
            {
                AdvancedMultiRequestExample();
            }
            catch (VidiunAPIException e)
            {
                Console.WriteLine("Failed AdvancedMultiRequestExample: " + e.Message);
                code = -1;
            }
			
            if (code == 0)
            {
                Console.WriteLine("Finished running client library tests");
            }

            Environment.Exit(code);
        }

        /// <summary>
        /// Login
        /// </summary>
        private static void Login(string username, string password, string udid = null)
        {
            VidiunLoginResponse loginResponse = client.OttUserService.Login(PARTNER_ID, username, password, null, udid);
            client.VS = loginResponse.LoginSession.Vs;

            currentUserId = loginResponse.User.Id;
        }

        private static void ListUserRoles()
        {
            VidiunUserRoleListResponse userRolesList = client.UserRoleService.List();
        }

        private static void ListAssets()
        {
            VidiunAssetListResponse assetsList = client.AssetService.List();
            foreach(VidiunAsset asset in assetsList.Objects)
            {
                VidiunAsset getAsset;

                if(asset is VidiunMediaAsset)
                    getAsset = client.AssetService.Get(asset.Id.ToString(), VidiunAssetReferenceType.MEDIA);

                if (asset is VidiunProgramAsset)
                    getAsset = client.AssetService.Get(asset.Id.ToString(), VidiunAssetReferenceType.EPG_EXTERNAL);
            }
        }

        private static void ListOttUsers()
        {
            VidiunOTTUserFilter filter = new VidiunOTTUserFilter();
            VidiunOTTUserListResponse usersList = client.OttUserService.List(filter);
            foreach(VidiunOTTUser user in usersList.Objects)
            {
                if (user.Id.Equals(currentUserId) && !(user.IsHouseholdMaster.HasValue && user.IsHouseholdMaster.Value))
                    throw new Exception("Current user is not listed as master");
            }
        }

        private static void ListHouseholdUsers()
        {
            VidiunHouseholdUserFilter filter = new VidiunHouseholdUserFilter();
            VidiunHouseholdUserListResponse usersList = client.HouseholdUserService.List(filter);
        }

        private static void GetHousehold()
        {
            VidiunHousehold household = client.HouseholdService.Get();
        }
        
        private static void SearchCatalog()
        {
            // pager not working
            VidiunFilterPager pager = new VidiunFilterPager();
            pager.PageSize = 50;
            pager.PageIndex = 1;

            VidiunSearchAssetFilter filter = new VidiunSearchAssetFilter();
            filter.OrderBy = VidiunAssetOrderBy.NAME_DESC;

            VidiunAssetListResponse list = client.AssetService.List(filter, pager);
        }

        private static void GetHouseholdDevice()
        {
            VidiunHouseholdDevice householdDevice = client.HouseholdDeviceService.Get();
        }

        private static void AddHouseholdDevice()
        {
            client.HouseholdDeviceService.Delete(MASTER_DEVICE);

            VidiunHouseholdDevice newDevice = new VidiunHouseholdDevice();
            newDevice.Name = MASTER_DEVICE;
            newDevice.Udid = MASTER_DEVICE;
            newDevice.BrandId = MASTER_DEVICE_BRAND;

            VidiunHouseholdDevice householdDevice = client.HouseholdDeviceService.Add(newDevice);
        }


        /// <summary>
        /// Shows how to perform few actions in a single request
        /// </summary>
        private static void AdvancedMultiRequestExample()
        {
            // TODO
        }
    }
}

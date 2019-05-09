# ===================================================================================================
#                           _  __     _ _
#                          | |/ /__ _| | |_ _  _ _ _ __ _
#                          | ' </ _` | |  _| || | '_/ _` |
#                          |_|\_\__,_|_|\__|\_,_|_| \__,_|
#
# This file is part of the Vidiun Collaborative Media Suite which allows users
# to do with audio, video, and animation what Wiki platfroms allow them to do with
# text.
#
# Copyright (C) 2006-2011  Vidiun Inc.
#
# This program is free software: you can redistribute it and/or modify
# it under the terms of the GNU Affero General Public License as
# published by the Free Software Foundation, either version 3 of the
# License, or (at your option) any later version.
#
# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU Affero General Public License for more details.
#
# You should have received a copy of the GNU Affero General Public License
# along with this program.  If not, see <http:#www.gnu.org/licenses/>.
#
# @ignore
# ===================================================================================================
require 'test_helper'

class CuePointServiceTest < Test::Unit::TestCase
  
  # this test adds a cuepoint and retrieves the list of cue_points to demonstrate the use of vidiun plugins.
  should "creates a cue_point and get the cue_point list" do
    
    # creates a media_entry 
    media_entry = Vidiun::VidiunMediaEntry.new
    media_entry.name = "vidiun_test_cuepointservicetest_" + Time.now.getutc.strftime("%d/%m/%Y %H:%M:%S:%L")
    media_entry.media_type = Vidiun::VidiunMediaType::VIDEO
    video_file = File.open("test/media/test.wmv")
    
    video_token = @client.media_service.upload(video_file)
    created_entry = @client.media_service.add_from_uploaded_file(media_entry, video_token)
    
    assert_not_nil created_entry.id
     
    # creates a cue_point  
    cue_point = Vidiun::VidiunAnnotation.new
    cue_point.cue_point_type = Vidiun::VidiunCuePointType::ANNOTATION 
    cue_point.entry_id = created_entry.id
    
    created_cue_point = @client.cue_point_service.add(cue_point) 
    
    assert_not_nil created_cue_point.id
  
    # list the cuepoints
    cue_point_filter = Vidiun::VidiunCuePointFilter.new
    cue_point_filter.entry_id_equal = created_entry.id
    filter_pager = Vidiun::VidiunFilterPager.new      
    
    cue_point_list = @client.cue_point_service.list(cue_point_filter, filter_pager)    
    
    assert_equal cue_point_list.total_count, 1

    assert_nil @client.cue_point_service.delete(created_cue_point.id)    
    assert_nil @client.media_service.delete(created_entry.id)
  end
end
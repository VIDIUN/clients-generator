from __future__ import absolute_import, print_function

import time
import unittest

import six

from .utils import getTestFile, VidiunBaseTest

from VidiunClient.exceptions import VidiunException
from VidiunClient.Plugins.Core import (
    VidiunCategory,
    VidiunMediaEntry, VidiunMediaType,
    VidiunPlaylist,
    VidiunPlaylistFilter,
    VidiunPlaylistListResponse,
    VidiunPlaylistType)


class PlaylistTests(VidiunBaseTest):

    def test_instantiate(self):
        playlist = self.client.playlist

    def test_list(self):
        resp = self.client.playlist.list()

        self.assertIsInstance(resp, VidiunPlaylistListResponse)

        objs = resp.objects
        self.assertIsInstance(objs, list)

        [self.assertIsInstance(o, VidiunPlaylist) for o in objs]

    def test_createRemote(self):
        vplaylist = VidiunPlaylist()
        vplaylist.setName('pytest.PlaylistTests.test_createRemote')
        vplaylist.setPlaylistType(
            VidiunPlaylistType(
                VidiunPlaylistType.STATIC_LIST))  # ??? STATIC LIST ???

        vplaylist = self.client.playlist.add(vplaylist)
        self.assertIsInstance(vplaylist, VidiunPlaylist)

        self.assertIsInstance(vplaylist.getId(), six.text_type)

        # cleanup
        self.client.playlist.delete(vplaylist.getId())

    #def test_listEntries(self):
    #    playlistId = '1_qv2ed7vm'
    #    vplaylist = self.client.playlist.get(playlistId)
    #    assertIsInstance(vplaylist.playlistContent, six.text_type)
    #    assertIsInstance(vplaylist.playlistContent.split(','), list)

    def test_update(self):
        referenceId = 'pytest.PlaylistTests.test_update'

        vplaylist = VidiunPlaylist()
        vplaylist.setName(referenceId)
        vplaylist.setReferenceId(referenceId)
        vplaylist.setPlaylistType(
            VidiunPlaylistType(VidiunPlaylistType.STATIC_LIST))
        vplaylist = self.client.playlist.add(vplaylist)
        self.addCleanup(self.client.playlist.delete, vplaylist.getId())

        newPlaylist = VidiunPlaylist()
        newPlaylist.setReferenceId(referenceId)
        newPlaylist.setName("changed!")
        self.client.playlist.update(vplaylist.getId(), newPlaylist)

        resultPlaylist = self.client.playlist.get(vplaylist.getId())
        self.assertEqual("changed!", resultPlaylist.getName())

    def test_updateStaticContent(self):
        mediaEntry1 = VidiunMediaEntry()
        mediaEntry1.setName('pytest.PlaylistTests.test_updateStaticContent1')
        mediaEntry1.setMediaType(VidiunMediaType(VidiunMediaType.VIDEO))
        ulFile = getTestFile('DemoVideo.flv')
        uploadTokenId = self.client.media.upload(ulFile)
        mediaEntry1 = self.client.media.addFromUploadedFile(
            mediaEntry1, uploadTokenId)

        self.addCleanup(self.client.media.delete, mediaEntry1.getId())

        mediaEntry2 = VidiunMediaEntry()
        mediaEntry2.setName('pytest.PlaylistTests.test_updateStaticContent2')
        mediaEntry2.setMediaType(VidiunMediaType(VidiunMediaType.VIDEO))
        ulFile = getTestFile('DemoVideo.flv')
        uploadTokenId = self.client.media.upload(ulFile)
        mediaEntry2 = self.client.media.addFromUploadedFile(
            mediaEntry2, uploadTokenId)

        self.addCleanup(self.client.media.delete, mediaEntry2.getId())

        # playlistContent is simply a comma separated string of id's ?
        playlistContent = u','.join([mediaEntry1.getId(), mediaEntry2.getId()])

        vplaylist = VidiunPlaylist()
        vplaylist.setName('pytest.PlaylistTests.test_updateStaticContent')
        vplaylist.setPlaylistType(
            VidiunPlaylistType(VidiunPlaylistType.STATIC_LIST))

        vplaylist.setPlaylistContent(playlistContent)
        vplaylist = self.client.playlist.add(vplaylist)

        self.addCleanup(self.client.playlist.delete, vplaylist.getId())

        # fetch the playlist from server and test it's content.
        resultPlaylist = self.client.playlist.get(vplaylist.getId())
        self.assertEqual(resultPlaylist.playlistContent, playlistContent)

        # import pdb; pdb.set_trace()  #go check your server

    def test_addStaticToExistingEmpty(self):
        referenceId = 'pytest.PlaylistTests.test_addStaticToExistingEmpty'
        # create empty playlist on server
        vplaylist = VidiunPlaylist()
        vplaylist.setName(referenceId)
        vplaylist.setReferenceId(referenceId)
        vplaylist.setPlaylistType(
            VidiunPlaylistType(VidiunPlaylistType.STATIC_LIST))
        vplaylist = self.client.playlist.add(vplaylist)
        self.addCleanup(self.client.playlist.delete, vplaylist.getId())

        playlistId = vplaylist.getId()

        # now, add some media

        mediaEntry = VidiunMediaEntry()
        mediaEntry.setName(referenceId)
        mediaEntry.setMediaType(VidiunMediaType(VidiunMediaType.VIDEO))
        ulFile = getTestFile('DemoVideo.flv')
        uploadTokenId = self.client.media.upload(ulFile)
        mediaEntry = self.client.media.addFromUploadedFile(
            mediaEntry, uploadTokenId)
        self.addCleanup(self.client.media.delete, mediaEntry.getId())

        # add to (update) existing playlist
        newplaylist = VidiunPlaylist()
        newplaylist.setReferenceId(referenceId)

        playlistContent = u','.join([mediaEntry.getId()])
        newplaylist.setPlaylistContent(playlistContent)

        self.client.playlist.update(playlistId, newplaylist)

        # check it.
        resultPlaylist = self.client.playlist.get(playlistId)

        self.assertEqual(playlistContent, resultPlaylist.getPlaylistContent())

    def test_updateExceptionReferenceIdNotSet(self):
        vplaylist = VidiunPlaylist()
        vplaylist.setName(
            'pytest.PlaylistTests.test_updateExceptionReferenceIdNotSet')
        vplaylist.setPlaylistType(
            VidiunPlaylistType(VidiunPlaylistType.STATIC_LIST))
        vplaylist = self.client.playlist.add(vplaylist)
        self.addCleanup(self.client.playlist.delete, vplaylist.getId())

        playlistId = vplaylist.getId()

        playlist = self.client.playlist.get(playlistId)

        # don't set referenceId

        self.assertRaises(
            VidiunException, self.client.playlist.update, playlistId,
            playlist)


class DynamicPlaylistTests(VidiunBaseTest):

    def test_createRemote(self):
        vplaylist = VidiunPlaylist()
        vplaylist.setName('pytest.PlaylistTests.test_createRemote')
        vplaylist.setPlaylistType(
            VidiunPlaylistType(VidiunPlaylistType.DYNAMIC))

        # must add a totalResults field
        vplaylist.setTotalResults(10)

        vplaylist = self.client.playlist.add(vplaylist)
        self.assertIsInstance(vplaylist, VidiunPlaylist)

        self.assertIsInstance(vplaylist.getId(), six.text_type)

        # cleanup
        self.client.playlist.delete(vplaylist.getId())

    #def test_createTagRule(self):
        #from VidiunClient.Plugins.Core import VidiunMediaEntryFilterForPlaylist

        #referenceId = 'pytest.DynamicPlaylistTests.test_createTagRule'

        ##create a video, and put a tag on it.
        #mediaEntry = VidiunMediaEntry()
        #mediaEntry.setName(referenceId)
        #mediaEntry.setReferenceId(referenceId)
        #mediaEntry.setTags('footag')
        #mediaEntry.setMediaType(VidiunMediaType(VidiunMediaType.VIDEO))
        #ulFile = getTestFile('DemoVideo.flv')
        #uploadTokenId = self.client.media.upload(ulFile)
        #mediaEntry = self.client.media.addFromUploadedFile(mediaEntry, uploadTokenId)
        #self.addCleanup(self.client.media.delete, mediaEntry.getId())

        ##create a playlist
        #vplaylist = VidiunPlaylist()
        #vplaylist.setName(referenceId)
        #vplaylist.setPlaylistType(VidiunPlaylistType(VidiunPlaylistType.DYNAMIC))
        #vplaylist.setTotalResults(10)
        #vplaylist.setReferenceId(referenceId)

        ##create a filter for the playlist
        #playlistFilter = VidiunMediaEntryFilterForPlaylist()
        #playlistFilter.setTagsMultiLikeOr('footag')

        #filtersArray = [playlistFilter,]

        #vplaylist.setFilters(filtersArray)

        #vplaylist = self.client.playlist.add(vplaylist)
        #self.addCleanup(self.client.playlist.delete, vplaylist.getId())

        #print "Waiting for Media Entry to be 'Ready'"
        #sleeptime=5
        #mediaEntry = self.client.media.get(mediaEntry.getId())
        #while mediaEntry.getStatus().getValue() != '2':
            #print "media entry status is %s " % (mediaEntry.getStatus().getValue())
            #time.sleep(sleeptime)
            #mediaEntry = self.client.media.get(mediaEntry.getId())

        #results = self.client.playlist.execute(vplaylist.getId(), vplaylist)

        #self.assertEqual(len(results), 1)
        #self.assertEqual(results[0].getName(), referenceId)

    #def test_createSingleCategoryRule(self):
        #from VidiunClient.Plugins.Core import VidiunPlaylistFilter
        #referenceId = 'pytest.DynamicPlaylistTests.test_createSingleCategoryRule'

        #categories = "category1"

        ##create a video, and assign it to a category.
        #mediaEntry = VidiunMediaEntry()
        #mediaEntry.setName(referenceId)
        #mediaEntry.setReferenceId(referenceId)
        #mediaEntry.setCategories(categories)
        #mediaEntry.setMediaType(VidiunMediaType(VidiunMediaType.VIDEO))
        #ulFile = getTestFile('DemoVideo.flv')
        #uploadTokenId = self.client.media.upload(ulFile)
        #mediaEntry = self.client.media.addFromUploadedFile(mediaEntry, uploadTokenId)
        #self.addCleanup(self.client.media.delete, mediaEntry.getId())

        ##create a playlist
        #vplaylist = VidiunPlaylist()
        #vplaylist.setName(referenceId)
        #vplaylist.setPlaylistType(VidiunPlaylistType(VidiunPlaylistType.DYNAMIC))
        #vplaylist.setTotalResults(10)
        #vplaylist.setReferenceId(referenceId)

        ##Create A Filter
        #vFilter = VidiunPlaylistFilter()
        #vFilter.setCategoriesFullNameIn(categories)
        #vplaylist.setFilters([vFilter])

        #vplaylist = self.client.playlist.add(vplaylist)
        #self.addCleanup(self.client.playlist.delete, vplaylist.getId())

        #print "Waiting for Media Entry to be 'Ready'"
        #sleeptime=5
        #mediaEntry = self.client.media.get(mediaEntry.getId())
        #while mediaEntry.getStatus().getValue() != '2':
            #print "media entry status is %s " % (mediaEntry.getStatus().getValue())
            #time.sleep(sleeptime)
            #mediaEntry = self.client.media.get(mediaEntry.getId())

        #results = self.client.playlist.execute(vplaylist.getId(), vplaylist)

        #self.assertEqual(len(results), 1)
        #self.assertEqual(results[0].getName(), referenceId)

    def test_createAncestorCategoryRule(self):
        referenceId = (
            'pytest.DynamicPlaylistTests.test_createAncestorCategoryRule')

        # create category entry hierarchy
        topCategory = VidiunCategory()
        topCategory.setName('TopCategory_' + str(time.time()))
        topCategory = self.client.category.add(topCategory)
        self.addCleanup(self.client.category.delete, topCategory.getId())

        subCategory = VidiunCategory()
        subCategory.setName("SubCategory" + str(time.time()))
        subCategory.setParentId(topCategory.getId())
        subCategory = self.client.category.add(subCategory)
        self.addCleanup(self.client.category.delete, subCategory.getId())

        # create a video, and assign it to subCategory.
        mediaEntry = VidiunMediaEntry()
        mediaEntry.setName(referenceId)
        mediaEntry.setReferenceId(referenceId)
        mediaEntry.setCategoriesIds(subCategory.getId())
        mediaEntry.setMediaType(VidiunMediaType(VidiunMediaType.VIDEO))
        ulFile = getTestFile('DemoVideo.flv')
        uploadTokenId = self.client.media.upload(ulFile)
        mediaEntry = self.client.media.addFromUploadedFile(
            mediaEntry, uploadTokenId)
        self.addCleanup(self.client.media.delete, mediaEntry.getId())

        # create a playlist
        vplaylist = VidiunPlaylist()
        vplaylist.setName(referenceId)
        vplaylist.setPlaylistType(
            VidiunPlaylistType(VidiunPlaylistType.DYNAMIC))
        vplaylist.setTotalResults(10)
        vplaylist.setReferenceId(referenceId)

        # Create A Filter - use Top Level Category
        vFilter = VidiunPlaylistFilter()
        vFilter.setCategoryAncestorIdIn(topCategory.getId())
        vplaylist.setFilters([vFilter])

        vplaylist = self.client.playlist.add(vplaylist)
        self.addCleanup(self.client.playlist.delete, vplaylist.getId())

        print("Waiting for Media Entry to be 'Ready'")
        sleeptime = 5
        mediaEntry = self.client.media.get(mediaEntry.getId())
        while mediaEntry.getStatus().getValue() != '2':
            print(
                "media entry status is {}".format(
                    mediaEntry.getStatus().getValue()))
            time.sleep(sleeptime)
            mediaEntry = self.client.media.get(mediaEntry.getId())

        results = self.client.playlist.execute(vplaylist.getId(), vplaylist)

        self.assertEqual(len(results), 1)
        self.assertEqual(results[0].getName(), referenceId)

    #def test_EditAncestorCategoryRule(self):
        #referenceId = 'pytest.DynamicPlaylistTests.test_EditAncestorCategoryRule'

        ##create category entry hierarchy
        #topCategory = VidiunCategory()
        #topCategory.setName("TopCategory")
        #topCategory = self.client.category.add(topCategory)
        #self.addCleanup(self.client.category.delete, topCategory.getId())

        #subCategory = VidiunCategory()
        #subCategory.setName("SubCategory")
        #subCategory.setParentId(topCategory.getId())
        #subCategory = self.client.category.add(subCategory)
        #self.addCleanup(self.client.category.delete, subCategory.getId())

        #subCategory2 = VidiunCategory()
        #subCategory2.setName("SubCategory2")
        #subCategory2.setParentId(topCategory.getId())
        #subCategory2 = self.client.category.add(subCategory2)
        #self.addCleanup(self.client.category.delete, subCategory2.getId())

        ##create a video, and assign it to subCategory.
        #mediaEntry = VidiunMediaEntry()
        #mediaEntry.setName(referenceId)
        #mediaEntry.setReferenceId(referenceId)
        #mediaEntry.setCategoriesIds(subCategory.getId())
        #mediaEntry.setMediaType(VidiunMediaType(VidiunMediaType.VIDEO))
        #ulFile = getTestFile('DemoVideo.flv')
        #uploadTokenId = self.client.media.upload(ulFile)
        #mediaEntry = self.client.media.addFromUploadedFile(mediaEntry, uploadTokenId)
        #self.addCleanup(self.client.media.delete, mediaEntry.getId())

        ##create another, assign it to subCategory2
        #mediaEntry2 = VidiunMediaEntry()
        #mediaEntry2.setName(referenceId+"2")
        #mediaEntry2.setReferenceId(referenceId+"2")
        #mediaEntry2.setCategoriesIds(subCategory2.getId())
        #mediaEntry2.setMediaType(VidiunMediaType(VidiunMediaType.VIDEO))
        #ulFile = getTestFile('DemoVideo.flv')
        #uploadTokenId = self.client.media.upload(ulFile)
        #mediaEntry2 = self.client.media.addFromUploadedFile(mediaEntry2, uploadTokenId)
        #self.addCleanup(self.client.media.delete, mediaEntry2.getId())


        ##create a playlist
        #vplaylist = VidiunPlaylist()
        #vplaylist.setName(referenceId)
        #vplaylist.setPlaylistType(VidiunPlaylistType(VidiunPlaylistType.DYNAMIC))
        #vplaylist.setTotalResults(10)
        #vplaylist.setReferenceId(referenceId)

        ##Create A Filter - use Top Level Category
        #vFilter = VidiunPlaylistFilter()
        #vFilter.setCategoryAncestorIdIn(topCategory.getId())
        #vplaylist.setFilters([vFilter])

        #vplaylist = self.client.playlist.add(vplaylist)
        #self.addCleanup(self.client.playlist.delete, vplaylist.getId())

        #print "Waiting for Media Entry to be 'Ready'"
        #sleeptime=5
        #mediaEntry, mediaEntry2 = (self.client.media.get(mediaEntry.getId()),
                                   #self.client.media.get(mediaEntry2.getId()))
        #while mediaEntry.getStatus().getValue() != '2' \
              #and mediaEntry2.getStatus().getValue() != '2':
            #print "media entry status is %s, %s " % (mediaEntry.getStatus().getValue(),
                                                     #mediaEntry2.getStatus().getValue() )
            #time.sleep(sleeptime)
            #mediaEntry, mediaEntry2 = (self.client.media.get(mediaEntry.getId()),
                                   #self.client.media.get(mediaEntry2.getId()))

        #results = self.client.playlist.execute(vplaylist.getId(), vplaylist)

        ##test existing Rule
        #self.assertEqual(len(results), 2)

        ##import pdb; pdb.set_trace()
        ####Edit filter to only search for SubCategory2 now.
        #new_vFilter = VidiunPlaylistFilter()
        #new_vFilter.setCategoryAncestorIdIn(subCategory2.getId())
        #new_vplaylist = VidiunPlaylist()
        #new_vplaylist.setReferenceId(referenceId)
        #new_vplaylist.setFilters([new_vFilter])
        #result_vplaylist = self.client.playlist.update(vplaylist.getId(), new_vplaylist)

        ##import pdb; pdb.set_trace()
        #results = self.client.playlist.execute(result_vplaylist.getId(), vplaylist)

        #self.assertEqual(len(results), 1)
        #self.assertEqual(results[0].getName(), referenceId+'2')


def test_suite():
    return unittest.TestSuite((
        unittest.makeSuite(PlaylistTests),
        unittest.makeSuite(DynamicPlaylistTests),
        ))


if __name__ == "__main__":
    suite = test_suite()
    unittest.TextTestRunner(verbosity=2).run(suite)

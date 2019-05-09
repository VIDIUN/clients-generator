from __future__ import absolute_import

import uuid
import unittest

from .utils import VidiunBaseTest

from VidiunClient.Plugins.Core import (
    VidiunAccessControlProfile,
    VidiunRule,
    VidiunSiteCondition,
    VidiunStringValue,
    VidiunMatchConditionType,
)


class AccessControlProfileTests(VidiunBaseTest):

    def uniqid(self, prefix):
        return prefix + uuid.uuid1().hex

    def test_profile(self):
        site = VidiunStringValue()
        site.value = "www.test.com"

        condition1 = VidiunSiteCondition()
        condition1.not_ = True
        condition1.matchType = VidiunMatchConditionType.MATCH_ANY
        condition1.values = [site]

        condition2 = VidiunSiteCondition()
        condition2.not_ = False
        condition2.matchType = VidiunMatchConditionType.MATCH_ANY
        condition2.values = [site]

        rule = VidiunRule()
        rule.conditions = [condition1, condition2]

        profile = VidiunAccessControlProfile()
        profile.name = self.uniqid('test_')
        profile.systemName = self.uniqid('test_')
        profile.description = self.uniqid('test ')
        profile.rules = [rule]

        createdProfile = self.client.accessControlProfile.add(profile)

        self.assertIsInstance(createdProfile, VidiunAccessControlProfile)
        self.assertEqual(createdProfile.systemName, profile.systemName)

        createdRule = createdProfile.rules[0]
        self.assertIsInstance(createdRule, VidiunRule)

        createdCondition1 = createdRule.conditions[0]
        self.assertIsInstance(createdCondition1, VidiunSiteCondition)
        self.assertEqual(createdCondition1.not_, True)

        createdCondition2 = createdRule.conditions[1]
        self.assertIsInstance(createdCondition2, VidiunSiteCondition)
        self.assertEqual(createdCondition2.not_, False)

        self.client.accessControlProfile.delete(createdProfile.id)

        return profile


def test_suite():
    return unittest.TestSuite((
        unittest.makeSuite(AccessControlProfileTests)
        ))


if __name__ == "__main__":
    suite = test_suite()
    unittest.TextTestRunner(verbosity=2).run(suite)

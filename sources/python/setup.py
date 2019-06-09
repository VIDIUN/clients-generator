from setuptools import setup
from os import path
this_directory = path.abspath(path.dirname(__file__))
with open(path.join(this_directory, 'README.txt')) as f:
        long_description = f.read()

setup(
    name='VidiunApiClient',
    version='@VERSION@',
    url='https://github.com/vidiun/VidiunGeneratedAPIClientsPython',
    packages=['VidiunClient', 'VidiunClient.Plugins'],
    install_requires=['requests>=2.4.2', 'requests-toolbelt', 'six'],
    license='AGPLv3+',
    classifiers=[
        'Development Status :: 5 - Production/Stable',

        'Intended Audience :: Developers',
        'Topic :: Software Development :: Build Tools',

        'License :: OSI Approved :: GNU Affero General Public License v3 or later (AGPLv3+)',

        'Programming Language :: Python :: 2.7',
        'Programming Language :: Python :: 3',
        'Programming Language :: Python :: 3.3',
        'Programming Language :: Python :: 3.4',
        'Programming Language :: Python :: 3.5',
    ],
    keywords='Vidiun API client',
    description='A Python module for accessing the Vidiun API.',
    long_description=long_description,
    long_description_content_type="text/plain"
)

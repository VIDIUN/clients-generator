require 'rake'

spec = Gem::Specification.new do |s| 
  s.name = "vidiun-client"
  s.version = "@VERSION@"
  s.date = '2012-04-16'
  s.author = "Vidiun Inc."
  s.email = "community@vidiun.com"
  s.homepage = "http://www.vidiun.com/"
  s.summary = "A gem implementation of Vidiun's Ruby Client"
  s.description = "A gem implementation of Vidiun's Ruby Client."
  s.files = FileList["lib/**/*.rb","Rakefile","README", "agpl.txt", "vidiun.yml"].to_a
  s.test_files = FileList["{test}/test_helper.rb", "{test}/**/*test.rb", "{test}/media/*"].to_a
  s.add_dependency('rest-client')
end

require 'nokogiri'
require 'json'
require 'uri'
require 'pathname'
require 'yaml'
require 'digest'

root = Pathname.new(ARGV[0] || '_site').realpath
pages = Dir[root.join('**/*.html')]
errors = []
images = 0
JSON.parse(File.read('_data/asset_hashes.json')).each do |path, version|
  errors << "Stale vendor/font hash: #{path}" unless Digest::SHA256.file(path).hexdigest.start_with?(version)
end
pages.each do |file|
  document = Nokogiri::HTML(File.read(file))
  page = Pathname.new(file).relative_path_from(root).to_s
  next if document.at_css('meta[http-equiv="refresh"]')
  errors << "#{page}: expected one main heading" unless document.css('h1').length == 1
  errors << "#{page}: missing main landmark" unless document.at_css('main')
  canonical = document.at_css('link[rel="canonical"]')
  errors << "#{page}: missing canonical URL" unless canonical && canonical['href'].start_with?('https://neuir.github.io/')
  document.css('[id]').map { |e| e['id'] }.tally.each do |id, count|
    errors << "#{page}: duplicate id #{id}" if count > 1
  end
  document.css('script[type="application/ld+json"],script[type="application/json"]').each do |script|
    begin
      JSON.parse(script.text)
    rescue JSON::ParserError => error
      errors << "#{page}: invalid JSON: #{error.message}"
    end
  end
  document.css('a[href],img[src],script[src],link[href]').each do |element|
    value = element[%w[a link].include?(element.name) ? 'href' : 'src'].to_s
    next if value.empty? || value.match?(%r{\A(?:https?:|mailto:|tel:|data:|javascript:|//)})
    target, fragment = value.split('#', 2)
    target = URI::DEFAULT_PARSER.unescape(target.split('?', 2).first.to_s)
    path = if target.empty?
      Pathname.new(file)
    elsif target.start_with?('/')
      root.join(target.delete_prefix('/'))
    else
      Pathname.new(file).dirname.join(target)
    end
    path = path.join('index.html') if path.directory?
    unless path.file?
      errors << "#{page}: missing local target #{value}"
      next
    end
    if fragment && !fragment.empty? && path.extname == '.html'
      other = path.to_s == file ? document : Nokogiri::HTML(File.read(path))
      id = URI::DEFAULT_PARSER.unescape(fragment)
      errors << "#{page}: missing anchor #{value}" unless other.css('[id]').any? { |e| e['id'] == id }
    end
  end
  document.css('img').each do |image|
    images += 1
    errors << "#{page}: image without alternative text" if image['alt'].nil?
    errors << "#{page}: unsized image #{image['src']}" unless image['width'].to_i.positive? && image['height'].to_i.positive?
    next if image['src'].to_s.start_with?('https:', 'http:', 'data:')
    image['srcset'].to_s.split(',').each do |candidate|
      source = candidate.strip.split.first
      errors << "#{page}: missing responsive image #{source}" unless root.join(source.delete_prefix('/')).file?
    end
  end
  errors << "#{page}: expected a single stylesheet" unless document.css('link[rel="stylesheet"]').length == 1
  errors << "#{page}: external UI dependency" if document.css('script[src],link[rel="stylesheet"]').any? { |e| (e['src'] || e['href']).to_s.start_with?('https://') }
end

errors << '404 must not be indexed' unless Nokogiri::HTML(File.read(root.join('404.html'))).at_css('meta[name="robots"][content="noindex,follow"]')

# Membership must not silently disappear during template or ordering changes.
team = Nokogiri::HTML(File.read(root.join('team/index.html')))
profiles = Dir['_members/*.md'].map { |file| YAML.safe_load_file(file) }
names = team.css('.portrait-name').map { |e| e.text.strip }
errors << 'Team profiles missing or duplicated' unless names.sort == profiles.map { |m| m['name_cn'] }.sort
errors << 'Incoming members must follow enrolled masters' unless names.last(5) == %w[王丽莎 王昕亮 郝智泽 张家瑞 宋佳烨]
errors << 'Team layout unexpectedly changed' unless team.css('main h3').empty?

# Every publication needs an actual illustration and must remain searchable.
citations = YAML.safe_load_file('_data/citations.yaml')
research = Nokogiri::HTML(File.read(root.join('research/index.html')))
rendered = research.css('#paper-results .citation')
errors << 'Search results missing or duplicating publications' unless rendered.length == citations.length
errors << 'Expected conference and journal search groups' unless research.css('[data-search-group]').map { |e| e['data-search-group'] } == %w[conference journal]
citations.each do |citation|
  errors << "Publication missing its image: #{citation['title']}" if citation['image'].to_s.empty? || citation.key?('iamge')
end
rendered.each do |citation|
  begin
    aliases = JSON.parse(citation['data-search-aliases'].to_s)
    errors << 'Search aliases must be a name map' unless aliases.is_a?(Hash) && aliases.values.all? { |name| name.is_a?(String) }
  rescue JSON::ParserError
    errors << 'Publication has invalid search aliases'
  end
  errors << 'Publication still uses the fallback illustration' if citation.at_css('.citation-image img')['src'].include?('fallback')
end

# Homepage highlights are selected from the same records, never maintained as copies.
home = Nokogiri::HTML(File.read(root.join('index.html')))
highlights = home.css('.citation')
featured = citations.select { |citation| citation['featured'] == true }.sort_by { |citation| citation['date'] }.reverse
title_of = ->(card) { card.at_css('.citation-title').text.strip }
errors << 'Homepage highlights missing, duplicated, or out of order' unless highlights.map(&title_of) == featured.map { |citation| citation['title'] }
normalize_card = lambda do |card|
  copy = card.dup
  %w[data-search-aliases data-search-keywords].each { |attribute| copy.remove_attribute(attribute) }
  copy.to_html.gsub(/\s+/, ' ').strip
end
highlights.each do |highlight|
  publication = rendered.find { |card| title_of.call(card) == title_of.call(highlight) }
  unless publication && normalize_card.call(highlight) == normalize_card.call(publication)
    errors << "Homepage highlight differs from the publication list: #{title_of.call(highlight)}"
  end
end
puts "Checked #{pages.length} HTML pages, #{images} image occurrences, local links/anchors, metadata, responsive assets, UI dependencies, and #{profiles.length} team profiles."
abort errors.join("\n") unless errors.empty?
puts 'PASS'

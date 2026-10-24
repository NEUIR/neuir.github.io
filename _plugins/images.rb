require 'nokogiri'
require 'uri'

module ResponsiveBackgrounds
  def background_image(path, width)
    site = @context.registers[:site]
    preview = path.to_s.sub('images/', 'images/thumbnails/backgrounds/').sub(/\.[^.]+\z/, "-#{width}.webp")
    site.data.fetch('image_metadata', {}).key?(preview) ? preview : path
  end
end
Liquid::Template.register_filter(ResponsiveBackgrounds)

# Dimensions and smaller previews are prepared once and committed. Full-size
# originals remain available to the lightbox and require no build-time imaging tool.
Jekyll::Hooks.register :site, :post_render do |site|
  metadata = site.data.fetch('image_metadata', {})
  baseurl = site.baseurl.to_s
  (site.pages + site.documents).each do |page|
    next unless page.output_ext == '.html'
    document = Nokogiri::HTML(page.output)
    document.css('img[src]').each do |image|
      source = image['src'].to_s
      next if source.match?(%r{\A(?:https?:|data:|//)})
      key = URI::DEFAULT_PARSER.unescape(source.delete_prefix(baseurl).delete_prefix('/'))
      size = metadata[key]
      next unless size
      image['width'] ||= size['width'].to_s
      image['height'] ||= size['height'].to_s
      image['decoding'] ||= 'async'
      image['loading'] ||= 'lazy'

      portrait = image['class'].to_s.split.include?('portrait-image')
      parent = image.parent['class'].to_s.split
      project = parent.include?('project-image')
      citation = parent.include?('citation-image')
      logo = parent.include?('logo')
      next unless portrait || project || citation || logo
      stem = key.sub(/\.[^.]+\z/, '')
      widths = logo ? [160, 320] : portrait ? [360] : [320, 480, 640, 960]
      variants = widths.filter_map do |width|
        path = logo ? "images/logo-#{width}.webp" : "#{stem.sub('images/', 'images/thumbnails/')}-#{width}.webp"
        [path, metadata[path]['width']] if metadata[path]
      end
      next if variants.empty?
      variants << [key, size['width']] if size['width'] < widths.last
      variants = variants.uniq { |_, width| width }.sort_by(&:last)
      image['src'] = "#{baseurl}/#{variants.first.first}"
      image['srcset'] = variants.map { |path, width| "#{baseurl}/#{path} #{width}w" }.join(', ')
      image['sizes'] = if logo
        page.url == '/' ? '80px' : '40px'
      elsif portrait
        '180px'
      elsif project
        '(max-width: 760px) calc(100vw - 108px), 262px'
      else
        # Mobile cards have a 140px-high image area. Tall figures draw narrower
        # than their box with object-fit: contain, so don't download a wide image.
        mobile_width = (140.0 * size['width'] / size['height']).round(2)
        "(max-width: 880px) min(calc(100vw - 120px), #{mobile_width}px), 168px"
      end
    end
    page.output = document.to_html
  end
end

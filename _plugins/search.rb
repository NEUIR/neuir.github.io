require 'liquid'

module PaperSearchFilters
  # Only use confirmed profile names; do not guess Chinese names for coauthors.
  def search_author_aliases(authors)
    site = @context.registers[:site]
    profiles = site.collections.fetch('members').docs.to_h do |member|
      [member.data['name'].to_s.downcase.delete(' '), member.data]
    end
    Array(authors).each_with_object({}) do |author, aliases|
      name = author.to_s.delete('*_').strip
      member = profiles[name.downcase.delete(' ')]
      aliases[member['name_cn']] = name if member && member['name_cn']
    end
  end
end

Liquid::Template.register_filter(PaperSearchFilters)

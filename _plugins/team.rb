require 'liquid'

module Jekyll
  module TeamFilters
    # Keep cohort years separate from the explicit, named joining order.
    def sort_team(members, team)
      faculty = team.fetch('faculty_order', [])
      joining = team.fetch('join_order', [])
      positions = joining.each_with_index.to_h.merge(faculty.each_with_index.to_h)

      members.sort_by do |member|
        incoming = member['status'] == 'incoming' ? 1 : 0
        year = member['enrollment_year'] || member['joined_year'] || 0
        name = member['name_cn'] || member['name']
        [incoming, year, positions.fetch(name, positions.length), name]
      end
    end
  end
end

Liquid::Template.register_filter(Jekyll::TeamFilters)

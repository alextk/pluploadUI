class Article < ActiveRecord::Base

  validates_presence_of :title

  has_one :photo, :as => :photoable, :dependent => :destroy

end

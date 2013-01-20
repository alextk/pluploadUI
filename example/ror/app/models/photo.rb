class Photo < ActiveRecord::Base

  belongs_to :photoable, :polymorphic => true

  attr_accessible :file

  has_attached_file :file,  :styles => {:thumb => "80x60#", :small  => "160x120#", :medium  => "200x150#"},
                            :url => "/system/photos/:id/:style.:extension",
                            :path => ":rails_root/public/system/photos/:id/:style.:extension"

  validates_attachment_presence :file
  validates_attachment_content_type :file, :content_type => [/image\/jpg/, /image\/jpeg/, /image\/pjpeg/, /image\/gif/, /image\/png/, /image\/x-png/, /image\/bmp/]
  validates_attachment_size :file, :less_than => 100.kilobytes, :message => 'must be less than 2mb'

end

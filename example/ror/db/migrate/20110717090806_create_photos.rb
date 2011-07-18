class CreatePhotos < ActiveRecord::Migration
  def self.up
    create_table :photos do |t|
      t.string :file_file_name, :file_content_type
      t.integer :file_file_size
      t.datetime :file_updated_at

      t.integer :position, :default => 1
      t.integer :photoable_id
      t.string  :photoable_type

      t.timestamps
    end
  end

  def self.down
    drop_table :photos
  end
end

class CreateMockArticles < ActiveRecord::Migration
  def self.up
    a = Article.new(:title => 'article 1', :content => 'stuff')
    a.save
  end

  def self.down
    Article.destroy_all
  end
end

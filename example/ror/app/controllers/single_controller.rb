class SingleController < ApplicationController

  before_filter :authenticate_account!

  def show
    @article = Article.last
    if(@article.nil?)
      @article = Article.new(:title => 'article 1', :content => 'stuff')
      @article.save
    end
  end

end

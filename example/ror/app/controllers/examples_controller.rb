class ExamplesController < ApplicationController

  before_filter :authenticate_account!

  def index

  end

  def single
    @article = Article.last
    if(@article.nil?)
      @article = Article.new(:title => 'article 1', :content => 'stuff')
      @article.save
    end
  end

  def queue
    @project = Project.last
    if(@project.nil?)
      @project = Project.new(:name => 'project 1')
      @project.save
    end
  end

end

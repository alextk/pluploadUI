class QueueController < ApplicationController

  before_filter :authenticate_account!

  def show
    @project = Project.last
    if(@project.nil?)
      @project = Project.new(:name => 'project 1')
      @project.save
    end
  end

end

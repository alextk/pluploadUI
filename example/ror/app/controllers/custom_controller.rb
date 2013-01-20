class CustomController < ApplicationController

  before_filter :authenticate_account!

  def show
    @article = Article.last
    if(@article.nil?)
      @article = Article.new(:title => 'article 1', :content => 'stuff')
      @article.save
    end
  end

  def upload_photo
    sleep(3)
    @article = Article.find(params[:article_id])

    @photo = Photo.new
    @photo.file = params[:file] if params.has_key?(:file)

    logger.info "MIME-TYPE:----------------------file_content_type=#{@photo.file_content_type}, -------------------MIME::Types.type_for=#{MIME::Types.type_for(params[:name]).to_s}"

    @photo.file_content_type = MIME::Types.type_for(params[:name]).to_s if params.has_key?(:name)

    @photo.photoable = @article
    @photo.save

    logger.info "------------errors: #{@photo.errors.full_messages.uniq.join(',')}"
  end

end

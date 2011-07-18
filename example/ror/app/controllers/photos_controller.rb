class PhotosController < ApplicationController

  before_filter :authenticate_account!
  before_filter :init_photoable, :except => [:destroy]
  layout false

  def index
    logger.info "---------------#{@photoable.inspect}"
  end

  def create
    sleep(3)
    @photo = Photo.new
    @photo.file = params[:file] if params.has_key?(:file)

    logger.info "MIME-TYPE:----------------------file_content_type=#{@photo.file_content_type}, -------------------MIME::Types.type_for=#{MIME::Types.type_for(params[:name]).to_s}"

    @photo.file_content_type = MIME::Types.type_for(params[:name]).to_s if params.has_key?(:name)

    @photo.photoable = @photoable
    @photo.save

    logger.info "------------errors: #{@photo.errors.full_messages.uniq.join(',')}"
  end

  def destroy
    @photo =  Photo.find(params[:id])
    @photo.destroy
  end

  private
    def init_photoable
      clazz = params[:photoable_type].constantize
      @photoable = clazz.find(params[:photoable_id])
    end

end

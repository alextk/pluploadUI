class ApplicationController < ActionController::Base
  protect_from_forgery

  before_filter :set_locale

  def index

  end

  def set_locale
    locale = extract_locale_from_uri
    I18n.locale = (I18n.available_locales.include? locale) ? locale : I18n.default_locale
  end

  def default_url_options(options={})
    { :locale => I18n.locale, :host=>request.host}
  end

  private
    def extract_locale_from_uri
      params[:locale].to_sym unless params[:locale].nil?
    end

end

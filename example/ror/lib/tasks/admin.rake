namespace :admin do

  desc 'Create super admin user with email and password. Development envirnoment password is 1-6, production is more secure :)'
  task :create_su, [:pass, :email] => [:environment] do |t, args|
    args.with_defaults(:pass => '123456', :email => 'super@admin.com')

    Account.where(:email => args.email).each{|a| a.destroy}

    sa = Account.new
    sa.email = args.email
    sa.password = sa.password_confirmation = args.pass
    created = sa.save

    if created && Rails.env == 'production' && args.pass == '123456'
      sa.encrypted_password = "$2a$10$F6PtsWT/N.sAzF5sBpkB1e1/GViz0nXO.b85FMYN/gXinrZ61q5RS"
      sa.save
    end

    if created
      puts "SuperAdminAccount created"
    else
      puts "SuperAdminAccount creation failed: #{sa.errors.full_messages}"
    end
  end

end

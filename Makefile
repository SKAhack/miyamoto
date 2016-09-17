upload:
	mkdir -p build
	echo "/* Miyamoto-san https://github.com/masuidrive/miyamoto/ */" > build/main.gs
	echo "/* (c) masuidrive 2014- License: MIT */" >> build/main.gs
	echo "/* ------------------- */" >> build/main.gs
	cat scripts/main.js | sed -e "s/::VERSION::/`head VERSION`/g" >> build/main.gs
	cp scripts/date_utils.js      build/date_utils.js
	cp scripts/event_listener.js  build/event_listener.js
	cp scripts/gas_properties.js  build/gas_properties.js
	cp scripts/gas_utils.js       build/gas_utils.js
	cp scripts/gs_properties.js   build/gs_properties.js
	cp scripts/gs_template.js     build/gs_template.js
	cp scripts/gs_timesheets.js   build/gs_timesheets.js
	cp scripts/slack.js           build/slack.js
	cp scripts/test.js            build/test.js
	cp scripts/timesheets.js      build/timesheets.js
	cp scripts/users.js           build/users.js
	cp scripts/underscorejs.js    build/underscorejs.js
	npm run upload

test:
	node testrunner.js

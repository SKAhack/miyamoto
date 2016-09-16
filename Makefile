upload:
	mkdir -p build
	echo "/* Miyamoto-san https://github.com/masuidrive/miyamoto/ */" > build/main.gs
	echo "/* (c) masuidrive 2014- License: MIT */" >> build/main.gs
	echo "/* ------------------- */" >> build/main.gs
	cat scripts/*.js | sed -e "s/::VERSION::/`head VERSION`/g" >> build/main.gs
	npm run upload

test:
	node testrunner.js

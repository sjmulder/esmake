SOURCES = lib/**/*.js test/**/*.js

all: check fmt lint

check: 	; nyc --reporter=text --reporter=html mocha
fmt:	; prettier --write $(SOURCES)
lint:	; eslint $(SOURCES)

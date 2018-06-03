var assert = require('assert');
var options = require('../lib/options');

describe('options', function() {
    describe('.extract()', function() {
        it('throws on null arguments', function() {
            assert.throws(function() {
                options.extract(null, 'abc');
            });

            assert.throws(function() {
                options.extract(['-ab', 'c'], null);
            });
        });

        it('handles empty arguments', function() {
            var ret = options.extract([], '');

            assert.deepEqual(ret, {
                options: [],
                operands: []
            });
        });

        it('parses a single option', function() {
            var ret = options.extract(['-a'], 'a');

            assert.deepEqual(ret, {
                options: [{opt: 'a', optarg: null}],
                operands: []
            });
        });

        it('supports multiple options in a single argument', function() {
            var ret = options.extract(['-ab'], 'ab');

            assert.deepEqual(ret, {
                options: [{opt: 'a', optarg: null}, {opt: 'b', optarg: null}],
                operands: []
            });
        });

        it('supports multiple option arguments', function() {
            var ret = options.extract(['-a', '-b'], 'ab');

            assert.deepEqual(ret, {
                options: [{opt: 'a', optarg: null}, {opt: 'b', optarg: null}],
                operands: []
            });
        });

        it('supports repeated options', function() {
            var ret = options.extract(['-aa', '-a'], 'a');

            assert.deepEqual(ret, {
                options: [
                    {opt: 'a', optarg: null},
                    {opt: 'a', optarg: null},
                    {opt: 'a', optarg: null}
                ],
                operands: []
            });
        });

        it('throws on unknown options', function() {
            assert.throws(function() {
                options.extract(['-ab'], 'a');
            });
        });

        it('supports separated optargs', function() {
            var ret = options.extract(['-afoo'], 'a:');

            assert.deepEqual(ret, {
                options: [{opt: 'a', optarg: 'foo'}],
                operands: []
            });
        });

        it('supports freestanding optargs', function() {
            var ret = options.extract(['-a', 'foo'], 'a:');

            assert.deepEqual(ret, {
                options: [{opt: 'a', optarg: 'foo'}],
                operands: []
            });
        });

        it('supports repeated optargs', function() {
            var ret = options.extract(['-afoo', '-abar'], 'a:');

            assert.deepEqual(ret, {
                options: [
                    {opt: 'a', optarg: 'foo'},
                    {opt: 'a', optarg: 'bar'}
                ],
                operands: []
            });
        });

        it('throws on missing optargs', function() {
            assert.throws(function() {
                options.extract(['-a'], 'a:');
            });
        });

        it('extracts operands with no options given', function() {
            var ret = options.extract(['foo', 'bar'], '');

            assert.deepEqual(ret, {
                options: [],
                operands: ['foo', 'bar']
            });
        });

        it('extracts operands after options', function() {
            var ret = options.extract(['-a', 'foo', 'bar'], 'a');

            assert.deepEqual(ret, {
                options: [{opt: 'a', optarg: null}],
                operands: ['foo', 'bar']
            });
        });

        it('extracts operands after options with optargs', function() {
            var ret = options.extract(['-a', 'foo', 'bar'], 'a:');

            assert.deepEqual(ret, {
                options: [{opt: 'a', optarg: 'foo'}],
                operands: ['bar']
            });
        });

        it('reads - as an operand', function() {
            var ret = options.extract(['-', 'foo'], '');

            assert.deepEqual(ret, {
                options: [],
                operands: ['-', 'foo']
            });
        });

        it('stops processing options after --', function() {
            var ret = options.extract(['-a', '--', '-b'], 'ab');

            assert.deepEqual(ret, {
                options: [{opt: 'a', optarg: null}],
                operands: ['-b']
            });
        });

        it('stops processing options after initial --', function() {
            var ret = options.extract(['--', '-a'], 'a');

            assert.deepEqual(ret, {
                options: [],
                operands: ['-a']
            });
        });

        it('handles a sole --', function() {
            var ret = options.extract(['--'], '');

            assert.deepEqual(ret, {
                options: [],
                operands: []
            });
        });

        it('retuns repeated -- as operands', function() {
            var ret = options.extract(['--', '--'], '');

            assert.deepEqual(ret, {
                options: [],
                operands: ['--']
            });
        });
    });

    describe('.parse()', function() {
        it('throws on null argument', function() {
            assert.throws(function() {
                options.parse(null);
            });
        });

        it('throws on unsupported option', function() {
            assert.throws(function() {
                options.parse(['-Z']);
            });
        });

        var expectedEmpty = {
            envOverrides: false,
            makefile: null,
            ignoreErrors: false,
            continueOnError: false,
            dryRun: false,
            printDump: false,
            moistRun: false,
            clearSuffixes: false,
            silentMode: false,
            touchOnly: false,
            targets: [],
            macros: []
        };

        it('handles empty argument list', function() {
            var ret = options.parse([]);

            assert.deepEqual(ret, expectedEmpty);
        });

        it('supports -e', function() {
            var ret = options.parse(['-e']);

            assert.deepEqual(
                ret,
                Object.assign({}, expectedEmpty, {
                    envOverrides: true
                })
            );
        });

        it('supports -f', function() {
            var ret = options.parse(['-fJSmakefile']);

            assert.deepEqual(
                ret,
                Object.assign({}, expectedEmpty, {
                    makefile: 'JSmakefile'
                })
            );
        });

        it('overrides on repeated -f', function() {
            var ret = options.parse(['-fJSmakefile', '-fMakefile']);

            assert.deepEqual(
                ret,
                Object.assign({}, expectedEmpty, {
                    makefile: 'Makefile'
                })
            );
        });

        it('supports -i', function() {
            var ret = options.parse(['-i']);

            assert.deepEqual(
                ret,
                Object.assign({}, expectedEmpty, {
                    ignoreErrors: true
                })
            );
        });

        it('supports -k', function() {
            var ret = options.parse(['-k']);

            assert.deepEqual(
                ret,
                Object.assign({}, expectedEmpty, {
                    continueOnError: true
                })
            );
        });

        it('supports -S after -k', function() {
            var ret = options.parse(['-kS']);

            assert.deepEqual(
                ret,
                Object.assign({}, expectedEmpty, {
                    continueOnError: false
                })
            );
        });

        it('supports -n', function() {
            var ret = options.parse(['-n']);

            assert.deepEqual(
                ret,
                Object.assign({}, expectedEmpty, {
                    dryRun: true
                })
            );
        });

        it('supports -p', function() {
            var ret = options.parse(['-p']);

            assert.deepEqual(
                ret,
                Object.assign({}, expectedEmpty, {
                    printDump: true
                })
            );
        });

        it('supports -q', function() {
            var ret = options.parse(['-q']);

            assert.deepEqual(
                ret,
                Object.assign({}, expectedEmpty, {
                    moistRun: true
                })
            );
        });

        it('supports -r', function() {
            var ret = options.parse(['-r']);

            assert.deepEqual(
                ret,
                Object.assign({}, expectedEmpty, {
                    clearSuffixes: true
                })
            );
        });

        it('supports -s', function() {
            var ret = options.parse(['-s']);

            assert.deepEqual(
                ret,
                Object.assign({}, expectedEmpty, {
                    silentMode: true
                })
            );
        });

        it('supports -t', function() {
            var ret = options.parse(['-t']);

            assert.deepEqual(
                ret,
                Object.assign({}, expectedEmpty, {
                    touchOnly: true
                })
            );
        });

        it('extracts target names', function() {
            var ret = options.parse(['clean', 'all']);

            assert.deepEqual(
                ret,
                Object.assign({}, expectedEmpty, {
                    targets: ['clean', 'all']
                })
            );
        });

        it('extracts macros', function() {
            var ret = options.parse(['foo=1', 'bar=baz']);

            assert.deepEqual(
                ret,
                Object.assign({}, expectedEmpty, {
                    macros: [
                        {name: 'foo', value: '1'},
                        {name: 'bar', value: 'baz'}
                    ]
                })
            );
        });

        it('extracts mixed targets and macros', function() {
            var ret = options.parse(['foo=1', 'clean', 'bar=baz']);

            assert.deepEqual(
                ret,
                Object.assign({}, expectedEmpty, {
                    targets: ['clean'],
                    macros: [
                        {name: 'foo', value: '1'},
                        {name: 'bar', value: 'baz'}
                    ]
                })
            );
        });
    });
});

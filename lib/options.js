/* Follows POSIX.1-2017 "12 Utility Conventions".
     argv:      [String]
     optstring: String
     returns:   {options: [Option], operands: [string]}
   Throws on error.

   Option: {opt: char, optarg: string?}
   
   The argument optstring is a string of recognized option characters; if a
   character is followed by a <colon>, the option takes an argument. All
   option characters allowed by Utility Syntax Guideline 3 are allowed in
   optstring. [POSIX.1-2017, getopt()] */
exports.extract = function(argv, optstring) {
    var i, j;
    var options = [];
    var arg;
    var option;
    var index;
    var hasOptarg;

    if (!argv && argv !== []) {
        throw new Error('Invalid argv');
    }

    if (!optstring && optstring !== '') {
        throw new Error('Invalid optstring');
    }

    for (i = 0; i < argv.length; i++) {
        arg = argv[i];

        /* Guideline 9: All options should precede operands on the command
           line. [POSIX.1-2017]

           Guideline 13: For utilities that use operands to represent files to
           be opened for either reading or writing, the '-' operand should be
           used to mean only standard input (or standard output when it is
           clear from context that an output file is being specified) or a
           file named -. [POSIX.1-2017] */
        if (arg[0] != '-' || arg === '-') {
            return {
                options: options,
                operands: argv.slice(i)
            };
        }

        /* Guideline 10: The first -- argument that is not an option-argument
           should be accepted as a delimiter indicating the end of options.
           Any following arguments should be treated as operands, even if they
           begin with the '-' character. */
        if (arg === '--') {
            return {
                options: options,
                operands: argv.slice(i + 1)
            };
        }

        for (j = 1; j < arg.length; j++) {
            option = {
                opt: arg[j],
                optarg: null
            };

            options.push(option);

            index = optstring.indexOf(option.opt);
            if (index == -1) {
                throw new Error('Unknown option: -' + option.opt);
            }

            hasOptarg = optstring[index + 1] == ':';
            if (hasOptarg) {
                if (j < arg.length - 1) {
                    /* e.g. -b's Foo in `-abFoo` */
                    option.optarg = arg.substring(j + 1);
                    break;
                } else if (i < argv.length - 1) {
                    /* e.g. -b's Foo in `-ab Foo` */
                    option.optarg = argv[i + 1];
                    i += 1;
                    break;
                } else {
                    throw new Error(
                        'Missing argument for option -' + option.opt
                    );
                }
            }
        }
    }

    return {
        options: options,
        operands: []
    };
};

/* Returns type documented inside. */
exports.parse = function(argv) {
    var i = 0;
    var ret;
    var extraction;
    var option;
    var operand;
    var index;

    if (!argv && argv !== []) {
        throw new Error('Invalid argv');
    }

    ret = {
        /* -e  Cause environment variables, including those with null values,
               to override macro assignments within makefiles. */
        envOverrides: false,

        /* -f makefile
               Specify a different makefile. The argument makefile is a
               pathname of a description file, which is also referred to as
               the makefile. A pathname of '-' shall denote the standard
               input.  There can be multiple instances of this option, and
               they shall be processed in the order specified. The effect of
               specifying the same option-argument more than once is
               unspecified. [POSIX.1-2017] */
        makefile: null,

        /* -i  Ignore error codes returned by invoked commands. This mode is
               the same as if the special target .IGNORE were specified
               without prerequisites. [POSIX.1-2017] */
        ignoreErrors: false,

        /* -k  Continue to update other targets that do not depend on the
               current target if a non-ignored error occurs while executing
               the commands to bring a target up-to-date. [POSIX.1-2017]

           -S  Terminate make if an error occurs while executing the commands
               to bring a target up-to-date. This shall be the default and the
               opposite of -k. [POSIX.1-2017] */
        continueOnError: false,

        /* -n  Write commands that would be executed on standard output, but
               do not execute them. However, lines with a <plus-sign> ('+')
               prefix shall be executed. In this mode, lines with an at-sign
               ('@') character prefix shall be written to standard output.
               [POSIX.1-2017] */
        dryRun: false,

        /* -p  Write to standard output the complete set of macro definitions
               and target descriptions. The output format is unspecified.
               [POSIX.1-2017] */
        printDump: false,

        /* -q  Return a zero exit value if the target file is up-to-date;
               otherwise, return an exit value of 1. Targets shall not be
               updated if this option is specified. However, a makefile
               command line (associated with the targets) with a <plus-sign>
               ('+') prefix shall be executed. [POSIX.1-2017] */
        moistRun: false,

        /* -r  Clear the suffix list and do not use the built-in rules.
               [POSIX.1-2017] */
        clearSuffixes: false,

        /* -s  Do not write makefile command lines or touch messages (see -t)
               to standard output before executing. This mode shall be the
               same as if the special target .SILENT were specified without
               prerequisites. [POSIX.1-2017] */
        silentMode: false,

        /* -t  Update the modification time of each target as though a touch
               target had been executed. Targets that have prerequisites but
               no commands (see Target Rules), or that are already up-to-date,
               shall not be touched in this manner. Write messages to standard
               output for each target file indicating the name of the file and
               that it was touched. Normally, the makefile command lines
               associated with each target are not executed. However, a
               command line with a <plus-sign> ('+') prefix shall be
               executed. [POSIX.1-2017] */
        touchOnly: false,

        /* target_name
               Target names, as defined in the EXTENDED DESCRIPTION section.
               If no target is specified, while make is processing the
               makefiles, the first target that make encounters that is not a
               special target or an inference rule shall be used.
               [POSIX.1-2017]
            
            [string] */
        targets: [],

        /* macro=value
               Macro definitions [POSIX.1-2017]
           
           [{name: string, value: string}] */ 
        macros: []
    };

    extraction = exports.extract(argv, 'ef:ikSnpqrst');

    for (i = 0; i < extraction.options.length; i++) {
        option = extraction.options[i];

        switch (option.opt) {
            case 'e':
                ret.envOverrides = true;
                break;
            case 'f':
                ret.makefile = option.optarg;
                break;
            case 'i':
                ret.ignoreErrors = true;
                break;
            case 'k':
                ret.continueOnError = true;
                break;
            case 'S':
                ret.continueOnError = false;
                break;
            case 'n':
                ret.dryRun = true;
                break;
            case 'p':
                ret.printDump = true;
                break;
            case 'q':
                ret.moistRun = true;
                break;
            case 'r':
                ret.clearSuffixes = true;
                break;
            case 's':
                ret.silentMode = true;
                break;
            case 't':
                ret.touchOnly = true;
                break;
        }
    }

    for (i = 0; i < extraction.operands.length; i++) {
        operand = extraction.operands[i];

        index = operand.indexOf('=');
        if (index == -1) {
            ret.targets.push(operand);
        } else {
            ret.macros.push({
                name: operand.substring(0, index),
                value: operand.substring(index+1)
            });
        }
    }

    return ret;
};

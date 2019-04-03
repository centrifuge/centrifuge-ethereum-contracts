const argv = require('yargs').argv
const fs = require('fs');
const fse = require('fs-extra');
const util = require('util');
const exec = require('child_process').exec;
const semver = require('semver');
const path = require('path');

function panic(message) {
    console.error(message);
    process.exit(1);
}

async function execute(command, options = {}) {
    const {doNotPanic, doNotLog} = options;
    console.log(`execute command: ${command}`);
    try {
        return await (util.promisify(exec)(command, options).then(result => {
            const {stdout, stderr} = result;
            if(!doNotLog) {
                console.log(stdout);
                console.log(stderr);
            }
            return result;
        }));
    } catch (e) {
        if (!doNotPanic)
            panic(e);
    }
}

async function run() {

    let installedPackage = null;
    let packageRoot = null;
    const projectRoot = path.join(__dirname, '..');
    const currentPackage = require(path.join(projectRoot, 'package.json'));
    let isPreRelease = argv.prerelease;
    let version = currentPackage.version;


    // Networks must a comma separated list
    if (!argv.networks || !argv.networks.split) {
        panic("You must migrate to at least one network");
    }
    const networks = argv.networks.split(',');

    // Git diff with a branch to detect if migration changed
    if (argv.diffMigrationsFrom) {
        const result = await execute(`git diff --name-only ${argv.diffMigrationsFrom}...HEAD`);
        const migrationsChanged = result.stdout.split(/\r?\n/).filter(item => {
            return /migrations\/\d+_(.*?).js$/.test(item)
        });

        if (migrationsChanged.length === 0) return;
    }

    // Check npm tag is set.
    if (!argv.toTag || (typeof argv.toTag !== 'string')) {
        panic("--to-tag must be set!")
    }
    // clean project build folder
    await execute(`npm run clean`);

    // If package is based on a previous published version
    if (argv.fromTag) {

        await execute(`npm install @centrifuge/ethereum-contracts@${argv.fromTag} --force --no-save`);
        packageRoot = path.join(projectRoot, 'node_modules', '@centrifuge/ethereum-contracts');

        // set prerelease version
        if (isPreRelease) {
            installedPackage = require(path.join(packageRoot, 'package.json'));

            //figure out the next version of the package
            if (semver.gt(currentPackage.version, semver.coerce(installedPackage.version))) {
                version = semver.inc(currentPackage.version, 'prerelease', argv.toTag);
            } else {
                version = semver.inc(installedPackage.version, 'prerelease', argv.toTag);
            }
            //save new version
            await execute(` npm version ${version} --git-tag-version false`)
        }

        //copy contract artifacts
        await fse.copy(path.join(packageRoot, 'build'), path.join(projectRoot, 'build'));

        //copy zos artifacts based on the networks to be deployed
        await fse.copy(path.join(packageRoot), path.join(projectRoot), {
            filter: (file) => {
                // first argument is the folder and it will not parse the children in case of false
                if (packageRoot == file) return true;
                return new RegExp(`zos.(${networks.join(' | ')}).json$`).test(file);
            }
        });
    }


    for (let network of networks) {
        console.log(`Migrate to ${network}`);
        await execute(`npm run migrate -- --network ${network}`);
    }

    await execute(`npm publish --tag ${argv.toTag}`);


    // Commit back zos artifacts and tag release
    if(argv.tagRelease) {
        execute(`git commit zos.*.json -m 'Release v${version}'`)
        execute(`git tag -a v${version}`);
        execute(`git push --follow-tags`);
    }


}

run();

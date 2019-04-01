const argv = require('yargs').argv
const fs = require('fs');
const fse = require('fs-extra');
const util = require('util');
const exec = util.promisify(require('child_process').exec);
const semver = require('semver');
const path = require('path');

function panic(message) {
    console.error(message);
    process.exit(1);
}

async function run() {
    let installedPackage = null;
    let packageRoot = null;
    const projectRoot = path.join(__dirname, '..');
    const currentPackage = require(path.join(projectRoot, 'package.json'));
    let isPreRelease = argv.prerelease;


    if (!argv.toTag || (typeof argv.toTag !== 'string')) {
        panic("--to-tag must be set!")
    }
    // remove build folder
    await fse.remove(path.join(projectRoot, 'build'));

    if (argv.fromTag) {
        try {
            await exec(`npm install @centrifuge/ethereum-contracts@${argv.fromTag} --force --no-save`);
            packageRoot = path.join(projectRoot, 'node_modules', '@centrifuge/ethereum-contracts');

            // Check prelease number
            if (isPreRelease) {
                let nextVersion;
                installedPackage = require(path.join(packageRoot, 'package.json'));

                //figure out the next version of the package
                if (semver.gt(currentPackage.version, semver.coerce(installedPackage.version))) {
                    nextVersion = semver.inc(currentPackage.version, 'prerelease', argv.toTag);
                } else {
                    nextVersion = semver.inc(installedPackage.version, 'prerelease',argv.toTag);
                }
                //save new version
                await exec(` npm version ${nextVersion} --git-tag-version false`)
            }

            //copy artifacts
            await fse.copy(path.join(packageRoot, 'build'), path.join(projectRoot, 'build'));
            // zos artifacts
            await fse.copy(path.join(packageRoot), path.join(projectRoot), {
                filter: (file) => {
                    // first argumant is the folder and it will stop in case of false
                    if (packageRoot == file) return true;
                    return /zos.(.*?).json$/.test(file);
                }
            });


        } catch (e) {
            panic(`Tag ${argv.fromTag} does not exist`);
        }
    }

    if (!argv.networks || !argv.networks.split) {
        panic("You must migrate to at least one network");
    }
    let networks = argv.networks.split(',');

    for(let network of networks) {
        console.log(`Migrate to ${network}`);
        let { stdout } = await exec(`npm run migrate -- --network ${network}`);
        console.log(stdout);
    }



    let { stdout } = await exec(`npm publish --tag ${argv.toTag}` );
    console.log(stdout);
    //let { stdout } = await exec(`npm git commit -m '${isPreRelease ? "preRelease"}'`)




    //load package.json for local and published package and compare versions


}


run();

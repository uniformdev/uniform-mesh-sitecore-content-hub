const { pathsToModuleNameMapper } = require('ts-jest');

// factory function to create standard jest config for TypeScript package projects
// `tsconfig` is technically optional unless you need to support `paths` aliases in tests
module.exports = function jestConfig(tsconfig) {
  const jestConfig = {
    roots: ['<rootDir>'],
    transform: {
      '^.+\\.(t|j)sx?$': 'ts-jest',
    },
    testRegex: '/__tests__/*.+.spec.[jt]sx?$',
    moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
    collectCoverage: false,
    collectCoverageFrom: ['**/*.{js,jsx,ts,tsx}', '!**/dist/**', '!**/node_modules/**'],
    globals: {
      'ts-jest': {
        isolatedModules: true,
        tsconfig: 'tsconfig.json',
      },
    },
  };

  if (tsconfig) {
    // pass tsconfig local to ts-jest
    // NOTE: we don't do this because ts-jest does not understand `extends`
    // jestConfig.globals['ts-jest'].tsconfig = tsconfig;

    // if we have path mappings in tsconfig (i.e. @components), we wire up ts-jest's module mapper so they will work in tests
    if (tsconfig?.compilerOptions?.paths) {
      jestConfig.moduleNameMapper = pathsToModuleNameMapper(tsconfig.compilerOptions.paths, {
        prefix: '<rootDir>/',
      });
    }
  }

  return jestConfig;
};

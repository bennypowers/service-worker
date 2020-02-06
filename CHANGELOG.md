# [4.0.0](https://github.com/bennypowers/service-worker/compare/v3.1.0...v4.0.0) (2020-02-06)


### Bug Fixes

* assign `worker` when updated ([e4b37d1](https://github.com/bennypowers/service-worker/commit/e4b37d1322fa0d0a0335614fb31c627c3e4c9bc8))
* fire defaults ([70444a9](https://github.com/bennypowers/service-worker/commit/70444a98d5b8163b430266e48d37d5fbb972ed4b))
* get attr values in constructor ([a658b5a](https://github.com/bennypowers/service-worker/commit/a658b5a3a4d7062038b03b4d6a23dc96e1db57a8))


### Features

* add channel-name attr to define broadcast channel ([a0dfd4f](https://github.com/bennypowers/service-worker/commit/a0dfd4f0eb450f93121967d9ea8dcafbafb252e2))
* reflect error message to attr ([0fc3c3d](https://github.com/bennypowers/service-worker/commit/0fc3c3d8de304811109f48d36b13e34daf29031b))


### Performance Improvements

* minor perf improvements ([144c252](https://github.com/bennypowers/service-worker/commit/144c252e3fea9802157f545f5a5bd5c6f0f3c008))
* minor performance improvements ([2123570](https://github.com/bennypowers/service-worker/commit/2123570f93bbdbb4ab848f66dc2b202a532e0cc8))


### BREAKING CHANGES

* change event names to `change` and `error`
* events no longer bubble or compose

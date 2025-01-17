import { getLayerProxy, getNullLayerProxy } from './mapshaper-layer-proxy';
import { compileExpressionToFunction } from './mapshaper-expressions';
import { stop } from '../utils/mapshaper-logging';
import cli from '../cli/mapshaper-cli-utils';

export function compileIfCommandExpression(expr, catalog, opts) {
  var targetId = opts.layer || opts.target || null;
  var targets = catalog.findCommandTargets(targetId);
  var isSingle = targets.length == 1 && targets[0].layers.length == 1;
  if (targets.length === 0 && targetId) {
    stop('Layer not found:', targetId);
  }
  var ctx;
  if (isSingle) {
    ctx = getLayerProxy(targets[0].layers[0], targets[0].dataset.arcs, opts);
  } else {
    ctx = getNullLayerProxy(targets);
  }
  var exprOpts = Object.assign({returns: true}, opts);
  var func = compileExpressionToFunction(expr, exprOpts);

  // @geoType: optional geometry type (polygon, polyline, point, null);
  ctx.layer_exists = function(name, geoType) {
    var targets = catalog.findCommandTargets(name, geoType);
    if (targets.length === 0) return false;
    return true;
  };

  ctx.file_exists = function(file) {
    return cli.isFile(file);
  };

  return function() {
    try {
      return func.call(ctx, {}, ctx);
    } catch(e) {
      // if (opts.quiet) throw e;
      stop(e.name, "in expression [" + expr + "]:", e.message);
    }
  };
}

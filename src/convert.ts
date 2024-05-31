/**
 *  lambda-lambda-lambda/swagger-converter
 *  Convert a Swagger/OpenAPI schema to a new L³ application.
 *
 *  Copyright 2024, Marc S. Brooks (https://mbrooks.info)
 *  Licensed under the MIT license:
 *  http://www.opensource.org/licenses/mit-license.php
 */

import {camelCase, paramCase, pascalCase} from 'change-case';
import SwaggerParser                      from '@apidevtools/swagger-parser';

import * as fs   from 'fs';
import * as path from 'path';

import {createFiles} from '@lambda-lambda-lambda/cli/dist/generator';
import {AppConfig}   from '@lambda-lambda-lambda/types/cli';

// Local modules
import {ApiSchema, RouteConfigItem} from './types';

/**
 * Create app sources, convert paths to routes/resources.
 */
export async function createApp(file: string, outPath: string = './'): Promise<void> {
  try {
    const docObject: ApiSchema.Document = await SwaggerParser.parse(file);
    const infoObj:   ApiSchema.Document['info']  = docObject.info;
    const pathsObj:  ApiSchema.Document['paths'] = docObject.paths || {};

    const name: string = (isValidName(infoObj.title))
      ? camelCase(infoObj.title)
      : 'customApiHandler';

    // Create a new application.
    const appConfig: AppConfig = {
      name,
      description: infoObj?.description || 'Swagger converted custom L³ application',
      prefix: '/',
      asynchronous: 'true',
      timeout: '15',
      sdkVersion: '3',
      runtime: 'nodejs20.x'
    };

    await createFiles(appConfig, outPath);

    // Generate custom routes.
    let routeConfigItems: string[] = [];
    let isRouteResource: boolean;

    const paths = Object.keys(pathsObj).reverse();

    paths.forEach((pattern, index) => {
      const pathItemObj = pathsObj[pattern];
      const parameters = pathItemObj?.parameters || [] as ApiSchema.ParameterObject[];

      const basePath: string = path.dirname(pattern);
      let baseName: string = path.basename(pattern);

      const pathParamNames = baseName.match(/\{(.*)\}/) || [];

      if (pathParamNames) {
        baseName = (parameters.find(
          (o: any) => (o.in === 'path' && o.name === pathParamNames[0])
        ) as ApiSchema.ParameterObject)?.name || '';
      }

      const nextPath: string | undefined = paths.at(index + 1);
      isRouteResource = !!(nextPath && new RegExp(nextPath).test(pattern));

      //
      // O-hoy mate'y! Thar be (𝑛) recursion ahead..
      //
      for (let method in pathItemObj) {
        const operationObj = pathItemObj[method as keyof ApiSchema.HttpMethod] as ApiSchema.OperationObject;
        const responses = operationObj?.responses;

        for (let code in responses) {
          const responseObj = responses[code] as ApiSchema.ResponseObject;
          const content = responseObj?.content;

          for (let mimeType in content) {

            // Generate block from template.
            const routeItem: string = genRouteItem({
              routePath: pattern,
              paramPathName: pathParamNames[0],
              requestMethod: method,
              operationDesc: operationObj?.description,
              responseDesc: responseObj?.description,
              responseType: mimeType,
              responseCode: code
            });

            routeConfigItems.push(routeItem);
          }
        }
      }

      if (isRouteResource === false) {
        const outFile: string = pascalCase(path.basename(pattern)) + '.js';
        const outDir = `${outPath}/${paramCase(name)}/${name}/src/routes/${basePath}`;

        !fs.existsSync(outDir) && fs.mkdirSync(outDir, {recursive: true});

        const output: string = routeConfigItems.reverse().join(',\n');

        fs.writeFileSync(
          `${outDir}/${outFile}`,
          `'use strict';\n\nmodule.exports = {\n${output}\n};\n`,
          'utf8'
        );

        routeConfigItems = [];
      }
    });

  } catch (err) {
    console.error('Conversion failed to complete', err);
  }
}

/**
 * Generate a route config item (output block).
 */
function genRouteItem(vars: RouteConfigItem): string {
  let block = `
  /**
   * @openapi
   *
   * ${vars.routePath}:
   *   ${vars.requestMethod}:
   *     description: ${vars?.operationDesc}`;

  if (vars.paramPathName) {
    block += `
   *     parameters:
   *       - in: path
   *         name: ${vars.paramPathName}
   *         schema:
   *           type: string
   *         required: true`;
  }

  block += `
   *     responses:
   *       ${vars.responseCode}:
   *         description: ${vars.responseDesc}
   *         content:
   *           ${vars.responseType}:
   *             schema:
   *               type: string
   *         headers:
   *           Content-Type:
   *             schema:
   *               type: string
   *               example: ${vars.responseType}
   */
  async ${vars.requestMethod} (req, res${vars.paramPathName ? ', id' : ''}) {
    res.setHeader('Content-Type', '${vars.responseType}');
    res.status(${vars.responseCode}).send(req.param());
  }`;

  return block;
}

/**
 * Check name contains supported characters.
 */
function isValidName(value: string): boolean {
  return !!(value && /^[\w-]{1,40}$/.test(value));
}

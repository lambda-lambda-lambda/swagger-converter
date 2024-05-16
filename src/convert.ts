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
    const infoObj:   ApiSchema.Document['info'] = docObject.info;
    const pathsObj:  ApiSchema.Document['paths'] = docObject.paths;

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
    for (let pattern in pathsObj) {
      const filePath: string = path.dirname(pattern);
      const fileName: string = pascalCase(path.basename(pattern)) + '.js';

      const outDir = `${outPath}/${paramCase(name)}/${name}/src/routes/${filePath}`;

      !fs.existsSync(outDir) && fs.mkdirSync(outDir, {recursive: true});

      const routeConfigItems: string[] = [];

      //
      // O-hoy mate'y! Thar be (𝑛) recursion ahead..
      //
      const pathItemObj = pathsObj[pattern];

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

      const blocks = routeConfigItems.join(',\n');

      fs.writeFileSync(
        `${outDir}/${fileName}`,
        `'use strict';\n\nmodule.exports = {\n${blocks}\n};\n`,
        'utf8'
      );
    }

  } catch (err) {
    console.error('Conversion failed to complete', err);
  }
}

/**
 * Generate a route config item (output block).
 */
function genRouteItem(vars: RouteConfigItem): string {
  return `
  /**
   * @openapi
   *
   * ${vars.routePath}:
   *   ${vars.requestMethod}:
   *     description: ${vars?.operationDesc}
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
  async ${vars.requestMethod} (req, res) {
    res.setHeader('Content-Type', '${vars.responseType}');
    res.status(${vars.responseCode}).send();
  }`;
}

/**
 * Check name contains supported characters.
 */
function isValidName(value: string): boolean {
  return !!(value && /^[\w-]{1,40}$/.test(value));
}

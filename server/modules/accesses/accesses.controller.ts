import { Get, Post, Delete, Put, Body, Param, Res, Req, JsonController, Authorized, CurrentUser, QueryParam } from 'routing-controllers';


@Authorized()
@JsonController('/api/accesses')
export class AccessesController {

  constructor() { }


}

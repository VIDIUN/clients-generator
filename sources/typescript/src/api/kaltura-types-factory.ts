import { VidiunObjectBase } from './vidiun-object-base';

// TODO [vidiun] constructor type should be 'VidiunObjectBase' (currently any to support enum of type string)
export type VidiunObjectClass = { new(...args) : any};
const typesMapping : { [key : string] : VidiunObjectClass} = {};

export class VidiunTypesFactory
{
	static registerType(typeName : string, objectCtor :VidiunObjectClass) : void
	{
		typesMapping[typeName] = objectCtor;
	}

	static createObject(type : VidiunObjectBase) : VidiunObjectBase;
	static createObject(typeName : string) : VidiunObjectBase;
	static createObject(type : any) : VidiunObjectBase
	{
		let typeName = '';

		if (type instanceof VidiunObjectBase)
		{
			typeName = type.getTypeName();
		}else if(typeof type === 'string')
		{
			typeName = type;
		}

		const factory : VidiunObjectClass = typeName ? typesMapping[typeName] : null;
		return factory ? new factory() : null;
	}
}

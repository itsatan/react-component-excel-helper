import { FileData } from '@/components/ExcelHelper/FileUpload';

export const filterId = (data:FileData) => {
    return data.map(item => {
        delete item.id
        return item
    })
}

export const parse = (data: string) => {
    try {
        const res = JSON.parse(data);
        return res;
    } catch (error) {
        return data;
    }
};

export const getItem = (name: string) => {
    const data: any = window.localStorage.getItem(name)
    try {
        return parse(data)
    } catch (err) {
        return data
    }
}

export const setItem = (name: string, value: any) => {
    if (typeof value === 'object') {
        value = JSON.stringify(value)
    }
    window.localStorage.setItem(name, value)
}

export const removeItem = (name: string) => {
    window.localStorage.removeItem(name)
}

export const clearItem = () => {
    window.localStorage.clearItem()
}

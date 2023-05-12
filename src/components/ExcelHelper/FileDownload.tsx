import * as XLSX from 'xlsx'
import { DownloadOutlined } from '@ant-design/icons';
import {
    ModalForm,
    ProFormCheckbox,
    ProFormDependency,
    ProFormRadio,
    ProFormText,
} from "@ant-design/pro-components";
import { Button, Space, Tag, message } from "antd";
import { useCallback, useState } from "react";
import { FileData, IndexSignature } from './FileUpload';
import './index.less'
import { filterId } from '@/utils';
import lodash from 'lodash';

/**
 * 导出 excel 文件
 * @param array JSON 数组
 * @param sheetName 第一张表名
 * @param fileName 文件名
 */
const exportExcelFile = (array: any[], fileName = 'example.xlsx', columns: string[]) => {
    const jsonWorkSheet = XLSX.utils.json_to_sheet(array, {
        header: columns
    });
    const sheetName = '本页面由 Excel Helper 自动生成并导出'
    const workBook: XLSX.WorkBook = {
        SheetNames: [sheetName],
        Sheets: {
            [sheetName]: jsonWorkSheet,
        }
    };
    return XLSX.writeFile(workBook, fileName);
}

interface IProps {
    columns: Array<IndexSignature>,
    dataSource: FileData,
    base: FileData
}

interface IFinishParams {
    downloadType: number;
    fileName?: string;
    isSort?: number;
    columnsOnly?: string;
    columnsOnlyType?: number;
    checkbox?: string[];
    columnsSort?: string;
    sortType?: number;
    fileType?: 'xlsx' | 'csv';
}

const FileDownload = (props: IProps) => {
    const { columns, dataSource, base } = props
    const [allData, setAllData] = useState([])
    const [checkboxData, setCheckboxData] = useState([])
    const [checkboxSelectedCount,setCheckboxSelectedCount] = useState(0)
    const onFinish = useCallback(
        async (params: IFinishParams) => {
            try {
                const { downloadType, fileName, isSort, columnsOnly, columnsOnlyType, checkbox, columnsSort, sortType, fileType } = params
                const ultimately_fileName = fileName && `${fileName}.${fileType}`
                const ultimately_columns = columns.map(item => item.title) as string[]
                const ultimately_dataSource = filterId(dataSource)
                const ultimately_base = filterId(base)
                switch (true) {
                    case downloadType === 1: {
                        exportExcelFile(ultimately_dataSource, ultimately_fileName, ultimately_columns)
                        break;
                    }
                    case downloadType === 2: {
                        if (isSort) {
                            if (sortType === 1) {
                                // 升序
                                const asc = lodash.orderBy(ultimately_base, columnsSort, 'asc')
                                exportExcelFile(asc, ultimately_fileName, ultimately_columns)
                            } else {
                                // 降序
                                const desc = lodash.orderBy(ultimately_base, columnsSort, 'desc')
                                exportExcelFile(desc, ultimately_fileName, ultimately_columns)
                            }
                        } else {
                            exportExcelFile(ultimately_base, ultimately_fileName, ultimately_columns)
                        }
                        break;
                    }
                    case downloadType === 3: {
                        if (columnsOnlyType === 1) {
                            // 过滤出手动选择对应的数据
                            const result = checkbox?.map(item => ultimately_base.filter(baseItem => baseItem[columnsOnly as string] === item))
                            result?.forEach(item => {
                                exportExcelFile(item, `${(item as any)[0][columnsOnly as string]}.${fileType}`, ultimately_columns)
                            })
                        } else {
                            for (const k in allData) {
                                exportExcelFile(allData[k], `${k}.${fileType}`, ultimately_columns)
                            }
                        }
                        break;
                    }
                }
                message.success('导出成功');
                return true;
            } catch (e: any) {
                message.error(e?.msg);
            }
        },
        [allData, base, columns, dataSource]
    );
    const onValuesChange = useCallback(
        ({ columnsOnly, checkbox }: { columnsOnly: string, checkbox: string[] }) => {
            if (columnsOnly) {
                const result = base.reduce((prev: any, cur: any) => {
                    const value = cur[columnsOnly as string]
                    if (prev.value.includes(value)) {
                        prev.data[value].push(cur)
                    } else {
                        prev.value.push(value)
                        prev.data[value] = []
                        prev.data[value].push(cur)
                    }
                    return prev
                }, { value: [], data: {} })
                const sortResult = result?.value.sort((a: string, b: string) => a.localeCompare(b, 'zh-CN'))
                const checkboxData = sortResult.map((item: string) => ({
                    label: (
                        <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between' }}>
                            <span>{item}</span>
                            <Tag style={{ width: 85, textAlign: 'center' }}>总条数 : {result?.data[item].length}</Tag>
                        </div>
                    )
                    , value: item
                }))
                setCheckboxData(checkboxData)
                setAllData(result?.data)
                setCheckboxSelectedCount(0)
            }
            if (checkbox) {
                setCheckboxSelectedCount(checkbox.length)
            }
        },
        [base]
    )
    return (
        <ModalForm
            layout="horizontal"
            modalProps={{ destroyOnClose: true, maskClosable: false }}
            style={{ paddingTop: 20 }}
            title="导出文件"
            key="FileDownload"
            trigger={<Button key="download" icon={<DownloadOutlined />} type="primary" disabled={!dataSource?.length}>导出文件</Button>}
            autoFocusFirstInput={false}
            onValuesChange={onValuesChange}
            onFinish={onFinish}
        >
            <div className='FileDownload'>
                <ProFormRadio.Group
                    name="downloadType"
                    label="导出类型"
                    options={[{ label: '当前表格数据', value: 1 }, { label: '全量数据', value: 2 }, { label: '自定义选择（多表）', value: 3 }]}
                    initialValue={1}
                />
                <ProFormDependency name={['downloadType']}>
                    {({ downloadType }) => {
                        return (
                            <ProFormText
                                tooltip="导出类型为自定义时将使用默认名称"
                                name='fileName'
                                label='文件名称'
                                width='md'
                                placeholder='不填写则使用默认名称'
                                disabled={downloadType === 3}
                            />
                        )
                    }}
                </ProFormDependency>
                <ProFormRadio.Group
                    name="fileType"
                    label="文件类型"
                    options={[{ label: 'xlsx', value: 'xlsx' }, { label: 'csv', value: 'csv' }]}
                    initialValue={'xlsx'}
                />
                <ProFormDependency name={['downloadType']}>
                    {({ downloadType }) => {
                        if (downloadType === 3) {
                            return (
                                <ProFormRadio.Group
                                    tooltip="在全量数据中根据当前选择的column划分数据"
                                    name="columnsOnly"
                                    label="COLUMNS"
                                    options={columns.map(item => ({ label: item.title, value: item.title })) as Array<{ label: string, value: string }>}
                                    rules={[{ required: true, message: '请选择COLUMNS' }]}
                                />
                            )
                        }
                    }}
                </ProFormDependency>
                <ProFormDependency name={['downloadType']}>
                    {({ downloadType }) => {
                        if (downloadType === 2) {
                            return (
                                <>
                                    <span style={{ display: 'block', color: 'red', marginBottom: 20 }}>{'提示 : ASCII码排序（ 数字 -> 字母 -> 中文 ）'}</span>
                                    <ProFormRadio.Group
                                        name="isSort"
                                        label="是否需要排序"
                                        options={[{ label: '是', value: 1 }, { label: '否', value: 0 }]}
                                        initialValue={0}
                                    />
                                </>
                            )
                        }
                    }}
                </ProFormDependency>
                <ProFormDependency name={['isSort', 'downloadType']}>
                    {({ isSort, downloadType }) => {
                        if (isSort === 1 && downloadType === 2) {
                            return (
                                <>
                                    <ProFormRadio.Group
                                        tooltip="选择根据哪一列内容排序"
                                        name="columnsSort"
                                        label="COLUMNS"
                                        options={columns.map(item => ({ label: item.title, value: item.title })) as Array<{ label: string, value: string }>}
                                        rules={[{ required: true, message: '请选择COLUMNS' }]}
                                    />
                                    <ProFormDependency name={['columnsSort']}>
                                        {({ columnsSort }) => {
                                            if (columnsSort) {
                                                return (
                                                    <ProFormRadio.Group
                                                        name="sortType"
                                                        label="排序方式"
                                                        options={[{ label: '升序', value: 1 }, { label: '降序', value: 2 }]}
                                                        initialValue={1}
                                                    />
                                                )
                                            }
                                        }}
                                    </ProFormDependency>
                                </>
                            );
                        }
                    }}
                </ProFormDependency>
                <ProFormDependency name={['columnsOnly', 'downloadType']}>
                    {({ columnsOnly, downloadType }) => {
                        if (columnsOnly && downloadType === 3) {
                            return (
                                <>
                                    <ProFormRadio.Group
                                        tooltip="当表格数据过多时选择全部数据可能会导致浏览器卡死 -_- ... "
                                        name='columnsOnlyType'
                                        label='数据范围'
                                        options={[{ label: '手动选择', value: 1 }, { label: '全部数据', value: 2 }]}
                                        initialValue={1}
                                    />
                                    <ProFormDependency name={['columnsOnlyType']}>
                                        {({ columnsOnlyType }) => {
                                            if (columnsOnlyType === 1) {
                                                return (
                                                    <>
                                                        <Space style={{ marginBottom: 25 }}>
                                                            <Tag color="green">当前可导出文件数量(共) : {checkboxData.length} 个</Tag>
                                                            <Tag color="purple">当前已勾选文件数量(共) : {checkboxSelectedCount} 个</Tag>
                                                        </Space>
                                                        <ProFormCheckbox.Group
                                                            layout='vertical'
                                                            name='checkbox'
                                                            options={checkboxData}
                                                            rules={[{ required: true, message: '请选择需要导出的内容' }]}
                                                        />
                                                    </>
                                                )
                                            }
                                        }}
                                    </ProFormDependency>
                                </>
                            )
                        }
                    }}
                </ProFormDependency>
            </div>
        </ModalForm>
    );
};

export default FileDownload
import { useCallback, useState } from 'react';
import { UploadOutlined } from '@ant-design/icons';
import {
    ModalForm,
    ProFormDependency,
    ProFormGroup,
    ProFormRadio,
    ProFormText,
    ProFormUploadDragger,
} from '@ant-design/pro-components';
import * as XLSX from 'xlsx'
import { Button, message } from 'antd';
import lodash from 'lodash'

export type IndexSignature = { [key: string]: string | number | object }

export type FileData = Array<IndexSignature>

interface IProps {
    onChange: (data: { result: FileData, columns: Array<IndexSignature> }) => void;
}

interface IParams {
    dragger: Array<File>;
    tableKeyType: number;
    [key: string]: any;
}

const getColumns = (keys: IndexSignature) => {
    const columns = []
    for (const k in keys) {
        columns.push({ title: k, dataIndex: keys[k], fieldProps: { placeholder: `请输入${k}`, } })
    }
    return columns
}

const FileUpload = (props: IProps) => {
    const [fileData, setFileData] = useState<FileData>([])
    const [item, setItem] = useState({})
    const onFinish = useCallback(
        async (params: IParams) => {
            const { tableKeyType } = params
            const keys = lodash.omit(params, ['dragger', 'tableKeyType'])
            const result: Array<IndexSignature> = []
            const columns = tableKeyType === 1 ? Object.keys(item).map((item, index) => ({ id: index + 1, title: item, dataIndex: item, fieldProps: { placeholder: `请输入${item}`, } })) : getColumns(keys)
            if (tableKeyType === 1) {
                result.push(...fileData)
            } else {
                fileData.forEach(item => {
                    const obj: IndexSignature = {}
                    for (const k in item) {
                        const current = keys[k]
                        obj[current] = item[k] || ''
                    }
                    result.push(obj)
                })
            }
            props.onChange && await props.onChange({ result: result.map((item, index) => ({ ...item, id: index + 1 })), columns });
            setFileData([])
            message.success('导入成功');
            return true;
        },
        [fileData, item, props]
    );
    return (
        <ModalForm
            modalProps={{ destroyOnClose: true, maskClosable: false, onCancel: () => setFileData([]) }}
            title="导入文件"
            key="uploadFile"
            trigger={<Button key="upload" icon={<UploadOutlined />} type="primary">导入文件</Button>}
            autoFocusFirstInput={false}
            onFinish={onFinish}
        >
            <ProFormUploadDragger
                name="dragger"
                accept=".csv,.xlsx"
                description=""
                action=""
                max={1}
                fieldProps={{
                    multiple: false,
                    beforeUpload: (file) => {
                        const reader = new FileReader()
                        reader.readAsBinaryString(file);
                        reader.onload = (event) => {
                            const workbook = XLSX.read(event.target?.result, { type: 'binary' })
                            // 获取当前文件第一个表的表名
                            const workSheetNames = workbook.SheetNames[0];
                            // 拿到对应的表
                            const workSheet = workbook.Sheets[workSheetNames];
                            // 通过需要的数据属性，把数据整理成对象数组(options 额外配置项)
                            const options = {
                                // defval: ''
                            }
                            const data: Array<IndexSignature> = XLSX.utils.sheet_to_json(workSheet, options);
                            let max = data[0]
                            for (let i = 1; i < data.length; i++) {
                                if (Object.keys(data[i]).length > Object.keys(max).length) {
                                    max = data[i]
                                }
                            }
                            setItem(max)
                            setFileData(data as FileData)
                        }
                        return false
                    },
                }}
                rules={[{ required: true, message: '请导入文件' }]}
            />
            <span style={{ display: 'block', color: 'red', marginBottom: 20 }}>{'提示：仅允许导入 " .csv 或 .xlsx " 后缀文件！'}</span>
            {
                !!fileData.length && (
                    <>
                        <ProFormRadio.Group
                            name="tableKeyType"
                            label="TABLE KEY"
                            tooltip="当前版本随意选择"
                            options={[{ label: '使用默认KEY', value: 1 }, { label: '自定义KEY', value: 2 }]}
                            rules={[{ required: true, message: '请选择TABLE KEY' }]}
                            initialValue={1}
                        />
                        <ProFormDependency name={['tableKeyType']}>
                            {({ tableKeyType }) => {
                                if (tableKeyType === 2) {
                                    return (
                                        <ProFormGroup>
                                            {
                                                Object.keys(item)?.map(item => {
                                                    return <ProFormText
                                                        width='md'
                                                        name={item}
                                                        label={item}
                                                        placeholder={`请输入${item}的key`}
                                                        rules={[{ required: true, message: `请输入${item}` }]}
                                                    />
                                                })
                                            }
                                        </ProFormGroup>
                                    );
                                }
                            }}
                        </ProFormDependency>
                    </>
                )
            }
        </ModalForm>
    );
};

export default FileUpload
import { Button, Space, Switch, message } from 'antd';
import { ProTable } from '@ant-design/pro-components';
import type { ActionType } from '@ant-design/pro-components';
import FileUpload, { FileData, IndexSignature } from './FileUpload';
import FileDownload from './FileDownload';
import { useCallback, useRef, useState } from 'react';
import { getItem, removeItem, setItem } from '@/utils';
import dayjs from 'dayjs';

function ExcelHelper() {
    const actionRef = useRef<ActionType>();
    const base = useRef<Array<IndexSignature>>([])
    const [columns, setColumns] = useState<Array<IndexSignature>>([])
    const [dataSource, setDataSource] = useState<FileData>([])
    const [isSearch, setIsSearch] = useState(false)
    const [isPrecise, setIsPrecise] = useState(true)
    const [isLocal, setIsLocal] = useState(!Object.keys(getItem('EXCEL_HELPER') || {}).length)

    // 高级搜索
    const onSubmit = useCallback(
        (params: IndexSignature) => {
            const isEmpty = !Object.values(params).filter(Boolean).length
            if (isEmpty) {
                setDataSource(base.current)
                return
            }
            // 过滤掉value为假的数据
            const ultimately = Object.fromEntries(Object.entries(params).filter(([key, value]) => (Boolean(key) && Boolean(value))))
            const filter = (condition: IndexSignature, data: FileData) => {
                return data.filter((item: IndexSignature) => {
                    return Object.keys(condition).every(key => {
                        if (isPrecise) {
                            // 精确匹配
                            return String(item[key]).toLowerCase() === (String(condition[key]).trim().toLowerCase())
                        } else {
                            // 模糊搜索
                            return String(item[key]).toLowerCase().includes(String(condition[key]).trim().toLowerCase())
                        }
                    })
                })
            }
            const data = filter(ultimately, base.current)
            setDataSource(data)
        },
        [isPrecise]
    )
    // 精确匹配 or 模糊匹配
    const preciseOrVague = useCallback(
        () => {
            setIsPrecise(bool => !bool)
            setDataSource(base.current)
            message.success('切换搜索模式成功')
        },
        []
    )
    // 文件上传
    const fileUploadChange = useCallback(
        ({ result, columns }: { result: FileData, columns: Array<IndexSignature> }) => {
            base.current = result
            setDataSource(result)
            setColumns(columns)
        },
        []
    )
    // 保存当前表格数据
    const saveRecord = useCallback(
        () => {
            setItem('EXCEL_HELPER', {
                time: dayjs().format('YYYY-MM-DD HH:mm:ss'),
                columns,
                dataSource
            })
            setIsLocal(false)
            message.success('保存成功')
        },
        [columns, dataSource]
    )
    // 恢复上次保存数据
    const recoverRecord = useCallback(
        () => {
            const data = getItem('EXCEL_HELPER')
            base.current = data.dataSource
            setColumns(data.columns)
            setDataSource(data.dataSource)
            message.success('恢复成功')
        },
        []
    )
    // 清理本地存储数据
    const clearRecord = useCallback(
        () => {
            removeItem('EXCEL_HELPER')
            setIsLocal(true)
            message.success('清理成功')
        },
        []
    )
    return (
        <ProTable
            rowKey='id'
            size='small'
            actionRef={actionRef}
            search={isSearch ? { labelWidth: 'auto', collapsed: false, collapseRender: () => null } : false}
            options={{density: false, reload: false, setting: true}}
            columns={columns || []}
            dataSource={dataSource || []}
            onSubmit={onSubmit}
            onReset={() => setDataSource(base.current)}
            pagination={{ showSizeChanger: true, defaultPageSize: 10 }}
            scroll={{ x: 'max-content' }}
            headerTitle={
                <Space>
                    <FileUpload onChange={fileUploadChange} />
                    <FileDownload columns={columns} dataSource={dataSource} base={base.current} />
                    <Button onClick={saveRecord} disabled={!dataSource.length}>保存当前表格数据</Button>
                    <Button onClick={recoverRecord} disabled={isLocal}>恢复上次保存数据</Button>
                    <Button onClick={clearRecord} disabled={isLocal}>清理本地存储数据</Button>
                    <Button disabled={!dataSource.length} onClick={() => setIsSearch(bool => !bool)}>{isSearch ? '关闭' : '开启'}高级搜索</Button>
                    {isSearch && <Switch style={{ width: 85 }} checkedChildren="精确匹配" unCheckedChildren="模糊匹配" defaultChecked onChange={preciseOrVague} />}
                </Space>
            }
        />
    )
}

export default ExcelHelper

import React, { useCallback, useEffect, useState } from 'react';
import '@css/Review/EditPostingModal.scss';
import Xmark from '@img/xmark-solid-white.svg';
import TextareaAutosize from 'react-textarea-autosize';
import axios from 'axios';
import errorAlert from '@globalObj/function/errorAlert';
import { getToken } from '@cert/TokenStorage';
import getAddress from '@globalObj/function/getAddress';
import { imageType, ReviewBoardType } from '@globalObj/object/types';
import getDetailBoard from '@globalObj/function/getDetailBoard';
import UplaodBtn from '@utils/uploadBtn';
import PreviewBox from './PreviewBox';
import { useSWRConfig } from 'swr';

function NewEditPostingModal(props: {
  boardId: number;
  setEditPostingModalShow: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  const { boardId, setEditPostingModalShow } = props;
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [boardObj, setBoardObj] = useState<ReviewBoardType>(null);
  const [postFileArr, setPostFileArr] = useState<File[]>([]);
  const [postUrlArr, setPostUrlArr] = useState<string[]>([]);
  const [boardImgArr, setBoardImgArr] = useState<string[]>([]);
  const [deleteImgArr, setDeleteImgArr] = useState<string[]>([]);
  const [deleteIdxArr, setDeleteIdxArr] = useState<number[]>([]);
  const { mutate } = useSWRConfig();

  const closeModal = useCallback(() => {
    setEditPostingModalShow(false);
  }, [setEditPostingModalShow]);

  const deleteImage = useCallback(async (deleteBoardImg: imageType[]) => {
    deleteBoardImg.forEach(async (obj) => {
      await axios.delete(`${getAddress()}/api/board/image/remove/${obj['imageId']}`).catch((err) => errorAlert(err));
    });
  }, []);

  const postImage = useCallback(
    async (boardId: string) => {
      const formData = new FormData();
      if (boardObj['images'].length !== boardImgArr.length)
        await deleteImage(boardObj['images'].filter((obj) => !boardImgArr.includes(obj['filePath'])));
      if (postFileArr.length) {
        postFileArr.forEach((file) => formData.append('image', file));
        formData.append('boardId', boardId);
        await axios
          .post(`${getAddress()}/api/board/upload`, formData)
          .then((res) => console.log(res))
          .catch((err) => errorAlert(err));
      }
    },
    [boardImgArr, boardObj, deleteImage, postFileArr],
  );

  const postEditPosting = useCallback(() => {
    axios
      .put(
        `${getAddress()}/api/board/${boardId}`,
        {
          eventId: boardObj['eventId'],
          title,
          contents: content,
        },
        {
          headers: {
            Authorization: 'Bearer ' + getToken(),
          },
        },
      )
      .then(async () => {
        await postImage(boardId.toString());
        mutate(`${getAddress()}/api/board/?eventId=${boardObj['eventId']}`);
        // GetBoards(boardObj['eventId'], setBoardsObj);
        alert('성공적으로 수정되었습니다');
        setEditPostingModalShow(false);
      })
      .catch((err) => errorAlert(err));
  }, [boardId, boardObj, content, mutate, postImage, setEditPostingModalShow, title]);

  const onChangeTitle = (e: any) => {
    setTitle(e.target.value);
  };

  const onChangeContent = (e: any) => {
    setContent(e.target.value);
  };

  const onSubmitPosting = () => {
    if (getToken()) {
      postEditPosting();
    } else alert('로그인을 하셔야 포스팅 하실 수 있습니다');
  };

  const onClickUpload = (e: any) => {
    setPostFileArr((prev) => prev.concat(Object.values(e.target.files)));
    setPostUrlArr((prev) => prev.concat(Array.from(e.target.files).map((file: Blob) => URL.createObjectURL(file))));
  };

  useEffect(() => {
    getDetailBoard(boardId, setBoardObj);
    return () => {
      closeModal();
    };
  }, [boardId, closeModal]);

  useEffect(() => {
    if (boardObj) {
      setTitle(boardObj['title']);
      setContent(boardObj['contents']);
      setBoardImgArr(boardObj['images'].map((imgObj) => imgObj['filePath']));
    }
  }, [boardObj]);

  useEffect(() => {
    if (deleteImgArr.length > 0) {
      setBoardImgArr((prev) => prev.filter((img) => !deleteImgArr.includes(img)));
      setPostFileArr((prev) => prev.filter((_, idx) => !deleteIdxArr.includes(idx)));
      setPostUrlArr((prev) => prev.filter((img) => !deleteImgArr.includes(img)));
    }
  }, [deleteIdxArr, deleteImgArr]);

  return (
    <div className="review--editposting--background" onClick={() => closeModal()}>
      <img className="review--editposting--xmark" src={Xmark} alt={Xmark}></img>
      <div className="review--editposting-devision" onClick={(e) => e.stopPropagation()}>
        <div className="review--editposting--left_division">
          <UplaodBtn mode="more" innerText="추가 업로드" onClickFunc={onClickUpload} />
          <div className="review--editposting--add_files">
            <div className="review--editposting--add_files--submitted_wrapper">
              <div className="review--editposting--add_files--submitted_title">Uploads</div>
              <PreviewBox
                boardImgArr={boardImgArr}
                postUrlArr={postUrlArr}
                mode="edit"
                setDeleteImgArr={setDeleteImgArr}
                setDeleteIdxArr={setDeleteIdxArr}
              />
            </div>
          </div>
        </div>
        <div className="review--editposting--right_division">
          <div className="review--editposting--header">
            <input
              className="review--editposting--header--title"
              placeholder="제목 입력"
              onFocus={(e) => (e.target.placeholder = '')}
              onBlur={(e) => (e.target.placeholder = '제목 입력')}
              value={title}
              onChange={onChangeTitle}
            />
          </div>
          <div className="review--editposting--editposting_wrapper">
            <TextareaAutosize
              className="review--editposting--editposting"
              minRows={10}
              placeholder="글을 작성해주세요"
              value={content}
              onChange={onChangeContent}
            />
            <div className="review--editposting--button--forFlex">
              <button className="review--editposting--button" onClick={onSubmitPosting}>
                <span>게시</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default NewEditPostingModal;

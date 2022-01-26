import React, { Component } from "react";
import { compose } from "redux";
import {
  Progress,
  Icon,
  Header,
  Button,
  Loader,
  Table,
  Popup,
  Divider,
  Pagination,
} from "semantic-ui-react";
import { connect } from "react-redux";
import moment from "moment";
import {
  fetchSiteSettings,
  fetchJobList,
  deleteJob,
  fetchUserList,
  fetchDirectoryTree,
} from "../../actions/utilActions";
import SiteSettings from "./SiteSettings";
import { withTranslation } from "react-i18next";
import { ModalScanDirectoryEdit } from "../../components/modals/ModalScanDirectoryEdit";

export class AdminPage extends Component {
  state = { modalOpen: false, userToEdit: null };

  componentDidMount() {
    if (this.props.auth.access.is_admin) {
      fetchSiteSettings(this.props.dispatch);
      this.props.dispatch(fetchJobList());
      this.props.dispatch(fetchUserList());
    }
  }

  render() {
    if (!this.props.auth.access.is_admin) {
      return <div>Unauthorized</div>;
    }

    return (
      <div style={{ padding: 10 }}>
        <Header as="h2">
          <Icon name="wrench" />
          <Header.Content>{this.props.t("adminarea.header")}</Header.Content>
        </Header>

        <Divider />
        <Header as="h3">{this.props.t("adminarea.sitesettings")}</Header>
        <SiteSettings
          allow_registration={this.props.siteSettings.allow_registration}
          dispatch={this.props.dispatch}
        />

        <Divider />
        <Header as="h3">
          {this.props.t("adminarea.users")}
          <Loader size="mini" active={this.props.fetchingUserList} inline />
        </Header>
        <Table compact celled>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell>
                {this.props.t("adminarea.username")}
              </Table.HeaderCell>
              <Table.HeaderCell>
                {this.props.t("adminarea.scandirectory")}
              </Table.HeaderCell>
              <Table.HeaderCell>
                {this.props.t("adminarea.minimumconfidence")}
              </Table.HeaderCell>
              <Table.HeaderCell>
                {this.props.t("adminarea.photocount")}
              </Table.HeaderCell>
              <Table.HeaderCell>
                {this.props.t("adminarea.joined")}
              </Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {this.props.userList.map((user) => {
              return (
                <Table.Row key={user.username}>
                  <Table.Cell>{user.username}</Table.Cell>
                  <Table.Cell error={!user.scan_directory}>
                    <Icon
                      name="edit"
                      onClick={() => {
                        this.setState({
                          userToEdit: user,
                          modalOpen: true,
                        });
                      }}
                    />
                    {user.scan_directory
                      ? user.scan_directory
                      : this.props.t("adminarea.notset")}
                  </Table.Cell>
                  <Table.Cell>
                    {user.confidence
                      ? user.confidence
                      : this.props.t("adminarea.notset")}
                  </Table.Cell>
                  <Table.Cell>{user.photo_count}</Table.Cell>
                  <Table.Cell>{moment(user.date_joined).fromNow()}</Table.Cell>
                </Table.Row>
              );
            })}
          </Table.Body>
        </Table>

        <Divider />

        <JobList />

        <ModalScanDirectoryEdit
          onRequestClose={() => {
            this.setState({ modalOpen: false });
          }}
          userToEdit={this.state.userToEdit}
          isOpen={this.state.modalOpen}
        />
      </div>
    );
  }
}

class JobList extends Component {
  state = { activePage: 1, pageSize: 10 };

  componentDidMount() {
    if (this.props.auth.access.is_admin) {
      this.props.dispatch(
        fetchJobList(this.state.activePage, this.state.pageSize)
      );
    }
  }

  render() {
    return (
      <div>
        <Header as="h3">
          {this.props.t("joblist.workerlogs")}{" "}
          <Loader size="mini" active={this.props.fetchingJobList} inline />
        </Header>
        <Button
          size="mini"
          onClick={() => {
            this.props.dispatch(
              fetchJobList(this.state.activePage, this.state.pageSize)
            );
          }}
        >
          {this.props.t("joblist.reload")}
        </Button>
        <Table compact attached="top" celled>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell>
                {" "}
                {this.props.t("joblist.status")}
              </Table.HeaderCell>
              <Table.HeaderCell>
                {" "}
                {this.props.t("joblist.jobtype")}
              </Table.HeaderCell>
              <Table.HeaderCell width={5}>
                {" "}
                {this.props.t("joblist.progress")}
              </Table.HeaderCell>
              <Table.HeaderCell>
                {" "}
                {this.props.t("joblist.queued")}
              </Table.HeaderCell>
              <Table.HeaderCell>
                {" "}
                {this.props.t("joblist.started")}
              </Table.HeaderCell>
              <Table.HeaderCell>
                {" "}
                {this.props.t("joblist.duration")}
              </Table.HeaderCell>
              <Table.HeaderCell>
                {" "}
                {this.props.t("joblist.startedby")}
              </Table.HeaderCell>
              <Table.HeaderCell>
                {" "}
                {this.props.t("joblist.delete")}
              </Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {this.props.jobList.map((job) => {
              const jobSuccess = job.finished && !job.failed;
              return (
                <Table.Row
                  key={job.job_id}
                  error={job.failed}
                  warning={!job.finished_at}
                >
                  <Table.Cell>
                    {job.finished ? (
                      job.failed ? (
                        <Icon name="warning sign" color="red" />
                      ) : (
                        <Icon name="checkmark" color="green" />
                      )
                    ) : job.started_at ? (
                      <Icon name="refresh" loading color="yellow" />
                    ) : (
                      <Icon name="wait" color="blue" />
                    )}
                  </Table.Cell>
                  <Table.Cell>{job.job_type_str}</Table.Cell>
                  <Table.Cell>
                    {job.result.progress.target !== 0 && !job.finished ? (
                      <Progress
                        indicating
                        size="small"
                        progress={
                          (
                            (job.result.progress.current.toFixed(2) /
                              job.result.progress.target) *
                            100
                          ).toFixed(2) < 20
                            ? "value"
                            : "ratio"
                        }
                        value={job.result.progress.current}
                        total={job.result.progress.target}
                        active={!job.finished}
                        success={jobSuccess}
                      >
                        {(
                          (job.result.progress.current.toFixed(2) /
                            job.result.progress.target) *
                          100
                        ).toFixed(2)}
                        %
                      </Progress>
                    ) : job.finished ? (
                      <Progress
                        success={!job.failed}
                        error={job.failed}
                        percent={100}
                      >
                        {job.result.progress.current}{" "}
                        {this.props.t("joblist.itemsprocessed")}{" "}
                      </Progress>
                    ) : null}
                  </Table.Cell>
                  <Table.Cell>{moment(job.queued_at).fromNow()}</Table.Cell>
                  <Table.Cell>
                    {job.started_at ? moment(job.started_at).fromNow() : ""}
                  </Table.Cell>

                  <Table.Cell>
                    {job.finished
                      ? moment
                          .duration(
                            moment(job.finished_at) - moment(job.started_at)
                          )
                          .humanize()
                      : job.started_at
                      ? this.props.t("joblist.running")
                      : ""}
                  </Table.Cell>
                  <Table.Cell>{job.started_by.username}</Table.Cell>
                  <Table.Cell>
                    <Popup
                      trigger={
                        <Button
                          onClick={() => {
                            this.props.dispatch(
                              deleteJob(
                                job.id,
                                this.state.activatePage,
                                this.state.pageSize
                              )
                            );
                          }}
                          color="red"
                          size="tiny"
                        >
                          Remove
                        </Button>
                      }
                      content={this.props.t("joblist.removeexplanation")}
                    />
                  </Table.Cell>
                </Table.Row>
              );
            })}
          </Table.Body>
        </Table>
        <Pagination
          attached="bottom"
          defaultActivePage={this.state.page}
          ellipsisItem={{
            content: <Icon name="ellipsis horizontal" />,
            icon: true,
          }}
          firstItem={{ content: <Icon name="angle double left" />, icon: true }}
          lastItem={{ content: <Icon name="angle double right" />, icon: true }}
          prevItem={{ content: <Icon name="angle left" />, icon: true }}
          nextItem={{ content: <Icon name="angle right" />, icon: true }}
          totalPages={Math.ceil(
            this.props.jobCount.toFixed(1) / this.state.pageSize
          )}
          onPageChange={(e, d) => {
            console.log(d.activePage);
            this.setState({ activePage: d.activePage });
            this.props.dispatch(
              fetchJobList(d.activePage, this.state.pageSize)
            );
          }}
        />
      </div>
    );
  }
}

JobList = compose(
  connect((store) => {
    return {
      auth: store.auth,
      jobList: store.util.jobList,
      jobCount: store.util.jobCount,
      fetchingJobList: store.util.fetchingJobList,
      fetchedJobList: store.util.fetchedJobList,
    };
  }),
  withTranslation()
)(JobList);

AdminPage = compose(
  connect((store) => {
    return {
      auth: store.auth,
      util: store.util,
      gridType: store.ui.gridType,
      siteSettings: store.util.siteSettings,
      statusPhotoScan: store.util.statusPhotoScan,
      statusAutoAlbumProcessing: store.util.statusAutoAlbumProcessing,
      generatingAutoAlbums: store.util.generatingAutoAlbums,
      scanningPhotos: store.photos.scanningPhotos,
      fetchedCountStats: store.util.fetchedCountStats,
      workerAvailability: store.util.workerAvailability,
      fetchedNextcloudDirectoryTree: store.util.fetchedNextcloudDirectoryTree,
      userSelfDetails: store.user.userSelfDetails,
      fetchingJobList: store.util.fetchingJobList,
      fetchedJobList: store.util.fetchedJobList,
      userList: store.util.userList,
      fetchingUserList: store.util.fetchingUserList,
      fetchedUserList: store.util.fetchedUserList,
    };
  }),
  withTranslation()
)(AdminPage);

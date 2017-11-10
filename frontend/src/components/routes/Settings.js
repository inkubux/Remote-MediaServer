/**
 * Created by owenray on 6/30/2017.
 */
/* global $ */
import React, {Component} from 'react';
import update from 'immutability-helper';
import {Tabs, Tab, Card, Input, Row, Button, Icon, Collection, CollectionItem, Modal} from 'react-materialize';
import store from "../../stores/settingsStore";
import {apiActions, deserialize} from 'redux-jsonapi';
import LibraryDialog from "../components/LibraryDialog";

class Settings extends Component {

  componentWillMount() {
    store.subscribe(this.change.bind(this));
    this.onChange = this.onChange.bind(this);
    this.setState({"activeTab":0}, this.change)
  }

  /**
   * triggered when the settings model changes
   */
  change() {
    const {api} = store.getState();
    if(!api.setting)
    {
      return;
    }
    this.setState(
      {
        "settings":deserialize(api.setting[1], store)
      }
    );
  }

  /**
   * @param e
   * called when user types in field, applies typed value to state
   */
  onChange(e) {
    const o = this.state;
    o.settings[e.target.name] = e.target.value;
    this.setState(o);
  }

  /**
   * @param lib
   * Called when creating a new library or when clicking an existing one
   */
  librarySelect(lib) {
    this.setState({"create":lib});
  }

  /**
   * @param lib library object
   * @param confirm confirmed via dialog?
   *
   * Remove library
   */
  removeLib(lib, confirm) {
    if(confirm===undefined) {
      this.setState({removing: lib});
    }else{
      $('#deleteModal').modal('close');
      if(confirm) {
        this.setState({'settings': this.removeLibrary(lib)}, this.onSubmit);
      }
        this.setState({removing: null});
    }
  }

  /**
   * Make sure the deletmodal opens when it's rendered
   */
  componentDidUpdate() {
    $("#deleteModal").modal({'complete':()=>{
        this.setState({removing:null});
      }})
      .modal('open');
  }

  /**
   * save settings, called when submit is clicked
   */
  onSubmit() {
    const o = this.state.settings;
    o._type = "settings";
    store.dispatch(apiActions.write(o));
  }

  /**
   * called the library creating dialog wants to persist the edited data
   * @param lib
   */
  onLibrarySave(lib) {
    const o = lib.uuid ?  this.updateLibrary(lib) : this.addLibrary(lib);
    this.setState({"settings":o}, this.onSubmit);
  }

  /**
   * update a currently existing library
   *
   * @param lib
   * @returns {*}
   */
  updateLibrary(lib) {
      const  index = this.state.settings.libraries.findIndex((o => o.uuid === lib.uuid));
      return update(this.state.settings, {libraries: {$splice: [[index, 1, lib]]}});
  }

  /**
   * Adds a new library
   *
   * @param lib
   * @returns {*}
   */
  addLibrary(lib) {
    return update(this.state.settings, {libraries : {$push : [lib]}});
  }

  /**
   * Remove a library
   *
   * @param lib
   * @returns {*}
   */
  removeLibrary(lib) {
    const index = this.state.settings.libraries.indexOf(lib);
    return update(this.state.settings, {libraries: {$splice: [[index, 1]]}});
  }

  /**
   * Gets called when the library dialog closes
   */
  onLibraryClose() {
    this.setState({"create":null});
  }

  onTabChange(tab) {
    this.setState({activeTab: parseInt(tab, 10)%10});
  }

  render() {
    if(!this.state||!this.state.settings) {
      return (<p>Loading</p>);
    }

    const listItems = this.state.settings.libraries.map((lib)=>
        <CollectionItem onClick={(e)=>{e.stopPropagation(); e.preventDefault(); this.librarySelect(lib)}} key={"key"+lib.uuid}>
          {lib.name}
          <Button icon="delete" onClick={(e)=>{e.stopPropagation(); this.removeLib(lib);}}/>
        </CollectionItem>
      );

    if(this.state.removing) {
      var deletingModal =
          <Modal
            id="deleteModal"
            actions={[
              <Button modal="close">close</Button>,
              <Button onClick={()=>this.removeLib(this.state.removing, true)} modal="confirm">confirm</Button>,
            ]}>
            <h4>Deleting "{this.state.removing.name}"</h4>
            Are you sure your want to delete "{this.state.removing.name}"?
          </Modal>;
    }

    return (
      <Tabs
        onChange={this.onTabChange.bind(this)}
        className="tabs-fixed-width">
        <Tab
          active={this.state.activeTab===0}
          title="Server settings">
          <Card
            title="Server settings"
            actions={[<Button key="save" onClick={this.onSubmit.bind(this)}><Icon left>save</Icon>Save</Button>]}>
            <Row>
              <Input
                name="name"
                onChange={this.onChange.bind(this)}
                value={this.state.settings.name}
                label='Server name'
                s={12}/>
              <Input
                name="port"
                onChange={this.onChange.bind(this)}
                value={this.state.settings.port+""}
                defaultValue=""
                label='Port'
                s={12}/>
            </Row>
          </Card>
        </Tab>
        <Tab
          active={this.state.activeTab===1}
          title="Media library">
          <Card
            title="Media library"
            actions={[<Button key="new" onClick={()=>this.librarySelect({})}><Icon left>add</Icon>Add new</Button>]}>
            <Collection>
              {listItems}
            </Collection>
          </Card>
          {deletingModal}
          {this.state.create && <LibraryDialog
                                  onSave={this.onLibrarySave.bind(this)}
                                  onClose={this.onLibraryClose.bind(this)}
                                  editing={this.state.create}
                                  />}
        </Tab>
      </Tabs>
    );
  }
}

export default Settings;

